import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      console.log('Got ElevenLabs signed URL, connecting...');

      // Connect to ElevenLabs WebSocket
      elevenLabsSocket = new WebSocket(signed_url);

      elevenLabsSocket.onopen = () => {
        console.log("ElevenLabs WebSocket connected");
        
        // Send initial configuration to ElevenLabs
        // For telephony integration, we need to specify the audio format
        const initMessage = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              tts: {
                // Twilio uses 8kHz mulaw audio for output
                output_format: "ulaw_8000"
              }
            }
          }
        };
        console.log("Sending ElevenLabs init config");
        elevenLabsSocket?.send(JSON.stringify(initMessage));
      };

      elevenLabsSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "audio":
              // ElevenLabs sends audio in audio_event.audio_base_64
              if (data.audio_event?.audio_base_64 && streamSid) {
                const mediaMessage = {
                  event: "media",
                  streamSid: streamSid,
                  media: {
                    payload: data.audio_event.audio_base_64
                  }
                };
                twilioSocket.send(JSON.stringify(mediaMessage));
              }
              break;
            
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
            
            case "conversation_initiation_metadata":
              console.log("Conversation initialized:", data.conversation_initiation_metadata_event?.conversation_id);
              console.log("User input format:", data.conversation_initiation_metadata_event?.user_input_audio_format);
              console.log("Agent output format:", data.conversation_initiation_metadata_event?.agent_output_audio_format);
              break;
              
            case "agent_response":
              console.log("Agent response:", data.agent_response_event?.agent_response);
              break;
              
            case "user_transcript":
              console.log("User said:", data.user_transcription_event?.user_transcript);
              break;
              
            case "interruption":
              console.log("User interrupted");
              break;
              
            case "agent_response_correction":
              console.log("Agent response corrected:", data.agent_response_correction_event?.corrected_agent_response);
              break;
            
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
          // Audio from caller, forward to ElevenLabs using the correct format
          if (elevenLabsSocket?.readyState === WebSocket.OPEN) {
            // ElevenLabs expects: { user_audio_chunk: base64_audio_string }
            const audioMessage = {
              user_audio_chunk: data.media.payload // base64 mulaw audio from Twilio
            };
            elevenLabsSocket.send(JSON.stringify(audioMessage));
          }
          break;

        case "stop":
          console.log("Twilio stream stopped");
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
