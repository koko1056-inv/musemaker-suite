import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Audio helpers (Twilio <-> ElevenLabs) ---
// Twilio Media Streams uses 8kHz G.711 mu-law (a.k.a. mulaw/ulaw).
// ElevenLabs ConvAI WebSocket is currently returning pcm_16000, so we transcode both directions.

const BIAS = 0x84;
const CLIP = 32635;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Keep it simple and safe (payload sizes are small in telephony streaming)
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function linearToMulawSample(sample: number): number {
  // sample: int16
  let sign = 0;
  let pcm = sample;
  if (pcm < 0) {
    sign = 0x80;
    pcm = -pcm;
    if (pcm > CLIP) pcm = CLIP;
  } else {
    if (pcm > CLIP) pcm = CLIP;
  }

  pcm = pcm + BIAS;

  // Determine exponent.
  let exponent = 7;
  for (let expMask = 0x4000; (pcm & expMask) === 0 && exponent > 0; expMask >>= 1) {
    exponent--;
  }

  const mantissa = (pcm >> (exponent + 3)) & 0x0f;
  const muLawByte = ~(sign | (exponent << 4) | mantissa);
  return muLawByte & 0xff;
}

function mulawToLinearSample(muLawByte: number): number {
  let mu = (~muLawByte) & 0xff;
  const sign = mu & 0x80;
  const exponent = (mu >> 4) & 0x07;
  const mantissa = mu & 0x0f;
  let pcm = ((mantissa << 3) + BIAS) << exponent;
  pcm -= BIAS;
  return sign ? -pcm : pcm;
}

function pcmBytesToInt16LE(pcmBytes: Uint8Array): Int16Array {
  const len = Math.floor(pcmBytes.length / 2);
  const out = new Int16Array(len);
  const dv = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);
  for (let i = 0; i < len; i++) out[i] = dv.getInt16(i * 2, true);
  return out;
}

function int16ToPcmBytesLE(samples: Int16Array): Uint8Array {
  const out = new Uint8Array(samples.length * 2);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < samples.length; i++) dv.setInt16(i * 2, samples[i], true);
  return out;
}

function mulaw8kBase64ToPcm16kBase64(mulawB64: string): string {
  const mulawBytes = base64ToBytes(mulawB64);

  // decode mu-law -> PCM 8k int16
  const pcm8k = new Int16Array(mulawBytes.length);
  for (let i = 0; i < mulawBytes.length; i++) {
    pcm8k[i] = mulawToLinearSample(mulawBytes[i]);
  }

  // upsample 8k -> 16k (zero-order hold: duplicate samples)
  const pcm16k = new Int16Array(pcm8k.length * 2);
  for (let i = 0; i < pcm8k.length; i++) {
    const s = pcm8k[i];
    pcm16k[i * 2] = s;
    pcm16k[i * 2 + 1] = s;
  }

  return bytesToBase64(int16ToPcmBytesLE(pcm16k));
}

function pcm16kBase64ToMulaw8kBase64(pcmB64: string): string {
  const pcmBytes = base64ToBytes(pcmB64);
  const pcm16k = pcmBytesToInt16LE(pcmBytes);

  // downsample 16k -> 8k (average pairs)
  const outLen = Math.floor(pcm16k.length / 2);
  const pcm8k = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const a = pcm16k[i * 2];
    const b = pcm16k[i * 2 + 1];
    pcm8k[i] = ((a + b) / 2) | 0;
  }

  // encode PCM 8k -> mu-law bytes
  const mulaw = new Uint8Array(pcm8k.length);
  for (let i = 0; i < pcm8k.length; i++) {
    mulaw[i] = linearToMulawSample(pcm8k[i]);
  }

  return bytesToBase64(mulaw);
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 });
  }

  console.log("WebSocket upgrade request received");

  // CRITICAL: Upgrade to WebSocket FIRST before any async operations
  const { socket: twilioSocket, response } = Deno.upgradeWebSocket(req);

  // Initialize variables - these will be set from Twilio's "start" event customParameters
  let elevenLabsSocket: WebSocket | null = null;
  let streamSid: string | null = null;
  let callSid: string | null = null;
  let agentId: string | null = null;
  let outboundCallId: string | null = null;
  let elevenLabsInitialized = false;
  let conversationSaved = false;

  // Set after we receive ElevenLabs conversation initiation metadata
  // Default to pcm_16000 because that's what ElevenLabs reports in practice; this prevents early-audio noise.
  let elevenUserInputFormat: string | null = "pcm_16000";
  let elevenAgentOutputFormat: string | null = "pcm_16000";
  let enableTranscoding = true;

  // Collect transcript and metadata during the call
  const transcript: Array<{ role: 'agent' | 'user'; text: string }> = [];
  let callStartTime: number = 0;
  let elevenLabsConversationId: string | null = null;

  // Function to save the conversation when the call ends
  const saveConversation = async () => {
    if (conversationSaved || !agentId) return;
    conversationSaved = true;

    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const endTime = Date.now();
      const durationSeconds = callStartTime > 0
        ? Math.floor((endTime - callStartTime) / 1000)
        : 0;

      console.log(`Saving conversation: agentId=${agentId}, transcript=${transcript.length} messages, duration=${durationSeconds}s`);

      // Insert conversation record
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          phone_number: null, // Will be updated from outbound call if available
          transcript: transcript,
          duration_seconds: durationSeconds,
          status: 'completed',
          ended_at: new Date(endTime).toISOString(),
          metadata: {
            elevenlabs_conversation_id: elevenLabsConversationId,
            call_sid: callSid,
            call_type: outboundCallId ? 'outbound' : 'inbound',
          }
        })
        .select()
        .single();

      if (convError) {
        console.error('Error saving conversation:', convError);
        return;
      }

      console.log(`Conversation saved: ${convData.id}`);

      // If this is an outbound call, link the conversation
      if (outboundCallId) {
        // Get phone number from outbound call
        const { data: outboundCall } = await supabase
          .from('outbound_calls')
          .select('to_number')
          .eq('id', outboundCallId)
          .single();

        // Update outbound_calls with conversation_id
        const { error: updateError } = await supabase
          .from('outbound_calls')
          .update({ 
            conversation_id: convData.id,
            status: 'completed',
            result: 'answered',
            duration_seconds: durationSeconds,
            ended_at: new Date(endTime).toISOString(),
          })
          .eq('id', outboundCallId);

        if (updateError) {
          console.error('Error updating outbound call:', updateError);
        } else {
          console.log(`Outbound call ${outboundCallId} linked to conversation ${convData.id}`);
        }

        // Update conversation with phone number
        if (outboundCall?.to_number) {
          await supabase
            .from('conversations')
            .update({ phone_number: outboundCall.to_number })
            .eq('id', convData.id);
        }
      }

      // Trigger summary generation asynchronously (Slack notification will be triggered after summary is generated)
      fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ conversationId: convData.id, agentId: agentId }),
      }).catch(err => console.error('Error triggering summary:', err));

      // Trigger webhooks asynchronously
      fetch(`${supabaseUrl}/functions/v1/send-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ conversationId: convData.id, agentId: agentId }),
      }).catch(err => console.error('Error triggering webhook:', err));

    } catch (error) {
      console.error('Error in saveConversation:', error);
    }
  };

  // Function to initialize ElevenLabs connection after we have the agentId
  const initializeElevenLabs = async () => {
    if (!agentId || elevenLabsInitialized) {
      return;
    }
    elevenLabsInitialized = true;

    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log(`Initializing ElevenLabs for agent ${agentId}`);

      // Get agent details to get ElevenLabs agent ID
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, name, elevenlabs_agent_id, workspace_id')
        .eq('id', agentId)
        .single();

      if (agentError || !agent || !agent.elevenlabs_agent_id) {
        console.error('Agent not found or missing ElevenLabs ID:', agentError);
        twilioSocket.close();
        return;
      }

      // Get workspace to get ElevenLabs API key
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('elevenlabs_api_key')
        .eq('id', agent.workspace_id)
        .single();

      if (workspaceError || !workspace?.elevenlabs_api_key) {
        console.error('Workspace or ElevenLabs API key not found:', workspaceError);
        twilioSocket.close();
        return;
      }

      console.log(`Agent found: ${agent.name}, ElevenLabs ID: ${agent.elevenlabs_agent_id}`);

      // Get signed URL for ElevenLabs conversation
      // IMPORTANT: Add output_format for Twilio telephony (mulaw 8kHz)
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agent.elevenlabs_agent_id}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': workspace.elevenlabs_api_key,
          },
        }
      );

      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error('Failed to get ElevenLabs signed URL:', errorText);
        twilioSocket.close();
        return;
      }

      const { signed_url } = await signedUrlResponse.json();
      
      // Append output_format parameter for telephony audio format
      const urlWithFormat = signed_url.includes('?') 
        ? `${signed_url}&output_format=ulaw_8000`
        : `${signed_url}?output_format=ulaw_8000`;
      
      console.log('Got ElevenLabs signed URL, connecting with ulaw_8000 format...');

      // Connect to ElevenLabs WebSocket with telephony audio format
      elevenLabsSocket = new WebSocket(urlWithFormat);

      elevenLabsSocket.onopen = () => {
        console.log("ElevenLabs WebSocket connected");
        
        // Send initial configuration to ElevenLabs for telephony
        // CRITICAL: Twilio uses 8kHz mulaw audio format
        const initMessage = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              tts: {
                output_format: "ulaw_8000"
              }
            },
            stt: {
              // Input from Twilio is also mulaw 8kHz
              encoding: "mulaw",
              sample_rate: 8000
            }
          },
          // Specify custom audio format for input stream
          custom_llm_extra_body: {
            audio_format: "mulaw_8000"
          }
        };
        console.log("Sending ElevenLabs init config:", JSON.stringify(initMessage));
        elevenLabsSocket?.send(JSON.stringify(initMessage));
      };

      elevenLabsSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "audio": {
              // ElevenLabs can send audio in different formats depending on version
              // Try both audio.chunk and audio_event.audio_base_64
              const audioPayload = data.audio?.chunk || data.audio_event?.audio_base_64;
              if (audioPayload && streamSid) {
                // If ElevenLabs is sending PCM, convert it to Twilio mulaw 8kHz
                const twilioPayload =
                  enableTranscoding && elevenAgentOutputFormat === "pcm_16000"
                    ? pcm16kBase64ToMulaw8kBase64(audioPayload)
                    : audioPayload;

                const mediaMessage = {
                  event: "media",
                  streamSid: streamSid,
                  media: {
                    payload: twilioPayload,
                  },
                };
                twilioSocket.send(JSON.stringify(mediaMessage));
              }
              break;
            }
            
            case "ping":
              // Respond to ping to keep connection alive
              if (data.ping_event?.event_id) {
                const pongMessage = {
                  type: "pong",
                  event_id: data.ping_event.event_id
                };
                elevenLabsSocket?.send(JSON.stringify(pongMessage));
              }
              break;
            
            case "interruption":
              // When user interrupts, clear the Twilio audio buffer
              console.log("User interrupted, clearing audio buffer");
              if (streamSid) {
                twilioSocket.send(JSON.stringify({ event: "clear", streamSid }));
              }
              break;
            
            case "conversation_initiation_metadata": {
              const meta = data.conversation_initiation_metadata_event;
              elevenUserInputFormat = meta?.user_input_audio_format ?? null;
              elevenAgentOutputFormat = meta?.agent_output_audio_format ?? null;
              elevenLabsConversationId = meta?.conversation_id ?? null;

              // If ElevenLabs is not using mulaw/ulaw, we must transcode to avoid loud noise.
              enableTranscoding =
                elevenUserInputFormat === "pcm_16000" || elevenAgentOutputFormat === "pcm_16000";

              // Mark call start time
              callStartTime = Date.now();

              console.log("Conversation initialized:", meta?.conversation_id);
              console.log("User input format:", elevenUserInputFormat);
              console.log("Agent output format:", elevenAgentOutputFormat);
              console.log(
                "Audio transcoding:",
                enableTranscoding ? "ENABLED (pcm_16000 <-> mulaw_8000)" : "disabled"
              );
              break;
            }
              
            case "agent_response": {
              const agentText = data.agent_response_event?.agent_response;
              if (agentText) {
                transcript.push({ role: 'agent', text: agentText });
                console.log("Agent response:", agentText);
              }
              break;
            }
              
            case "user_transcript": {
              const userText = data.user_transcription_event?.user_transcript;
              if (userText) {
                transcript.push({ role: 'user', text: userText });
                console.log("User said:", userText);
              }
              break;
            }
              
            case "agent_response_correction": {
              // Update the last agent response if it was corrected
              const correctedText = data.agent_response_correction_event?.corrected_agent_response;
              if (correctedText && transcript.length > 0) {
                // Find and update the last agent message
                for (let i = transcript.length - 1; i >= 0; i--) {
                  if (transcript[i].role === 'agent') {
                    transcript[i].text = correctedText;
                    break;
                  }
                }
              }
              console.log("Agent response corrected:", correctedText);
              break;
            }
            
            case "internal_tentative_agent_response":
              // Ignore tentative responses
              break;
              
            default:
              console.log("ElevenLabs message:", data.type);
          }
        } catch (e) {
          console.error("Error parsing ElevenLabs message:", e);
        }
      };

      elevenLabsSocket.onerror = (error) => {
        console.error("ElevenLabs WebSocket error:", error);
      };

      elevenLabsSocket.onclose = () => {
        console.log("ElevenLabs WebSocket closed");
        // Save conversation when ElevenLabs connection closes
        saveConversation();
        if (twilioSocket.readyState === WebSocket.OPEN) {
          twilioSocket.close();
        }
      };

    } catch (error) {
      console.error("Error setting up ElevenLabs connection:", error);
      twilioSocket.close();
    }
  };

  twilioSocket.onopen = () => {
    console.log("Twilio WebSocket connected, waiting for start event with parameters...");
  };

  twilioSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case "start":
          // Twilio stream started - extract custom parameters
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;
          
          // Get parameters from customParameters (sent via TwiML <Parameter> tags)
          const customParams = data.start.customParameters || {};
          agentId = customParams.agentId || null;
          outboundCallId = customParams.outboundCallId || null;
          
          console.log(`Stream started: ${streamSid}, Call: ${callSid}`);
          console.log(`Custom parameters - agentId: ${agentId}, outboundCallId: ${outboundCallId}`);
          
          // Now that we have the agentId, initialize ElevenLabs
          initializeElevenLabs();
          break;

        case "media":
          // Audio from caller (Twilio: mulaw_8000 base64)
          // ElevenLabs expects whatever format it negotiated (we often see pcm_16000 in metadata)
          if (elevenLabsSocket?.readyState === WebSocket.OPEN) {
            const twilioMulawB64 = data.media.payload as string;
            const elevenInputB64 =
              enableTranscoding && elevenUserInputFormat === "pcm_16000"
                ? mulaw8kBase64ToPcm16kBase64(twilioMulawB64)
                : twilioMulawB64;

            const audioMessage = {
              user_audio_chunk: elevenInputB64,
            };
            elevenLabsSocket.send(JSON.stringify(audioMessage));
          }
          break;

        case "stop":
          console.log("Twilio stream stopped");
          // Save conversation when Twilio stream stops
          saveConversation();
          if (elevenLabsSocket?.readyState === WebSocket.OPEN) {
            elevenLabsSocket.close();
          }
          break;

        case "mark":
          console.log("Twilio mark event:", data.mark.name);
          break;

        default:
          console.log("Twilio event:", data.event);
      }
    } catch (e) {
      console.error("Error processing Twilio message:", e);
    }
  };

  twilioSocket.onerror = (error) => {
    console.error("Twilio WebSocket error:", error);
    if (elevenLabsSocket?.readyState === WebSocket.OPEN) {
      elevenLabsSocket.close();
    }
  };

  twilioSocket.onclose = () => {
    console.log("Twilio WebSocket closed");
    if (elevenLabsSocket?.readyState === WebSocket.OPEN) {
      elevenLabsSocket.close();
    }
  };

  return response;
});
