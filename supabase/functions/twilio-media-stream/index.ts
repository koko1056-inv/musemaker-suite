import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 });
  }

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');
  const outboundCallId = url.searchParams.get('outboundCallId');

  console.log(`WebSocket connection for agent ${agentId}, outbound call ${outboundCallId}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get agent details to get ElevenLabs agent ID
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, name, elevenlabs_agent_id, workspace_id')
    .eq('id', agentId)
    .single();

  if (agentError || !agent || !agent.elevenlabs_agent_id) {
    console.error('Agent not found or missing ElevenLabs ID:', agentError);
    return new Response("Agent not found", { status: 404 });
  }

  // Get workspace to get ElevenLabs API key
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('elevenlabs_api_key')
    .eq('id', agent.workspace_id)
    .single();

  if (workspaceError || !workspace?.elevenlabs_api_key) {
    console.error('Workspace or ElevenLabs API key not found:', workspaceError);
    return new Response("ElevenLabs API key not configured", { status: 400 });
  }

  // Upgrade to WebSocket
  const { socket: twilioSocket, response } = Deno.upgradeWebSocket(req);

  let elevenLabsSocket: WebSocket | null = null;
  let streamSid: string | null = null;
  let callSid: string | null = null;
  
  // Audio buffers and state
  const audioQueue: string[] = [];
  let isProcessing = false;

  twilioSocket.onopen = async () => {
    console.log("Twilio WebSocket connected");
    
    try {
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
      console.log('Got ElevenLabs signed URL');

      // Connect to ElevenLabs WebSocket
      elevenLabsSocket = new WebSocket(signed_url);

      elevenLabsSocket.onopen = () => {
        console.log("ElevenLabs WebSocket connected");
        
        // Send initial configuration to ElevenLabs
        const initMessage = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              tts: {
                // Twilio uses 8kHz mulaw audio
                output_format: "ulaw_8000"
              }
            }
          }
        };
        elevenLabsSocket?.send(JSON.stringify(initMessage));
      };

      elevenLabsSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "audio":
              // ElevenLabs sends base64 audio, forward to Twilio
              if (data.audio && streamSid) {
                const mediaMessage = {
                  event: "media",
                  streamSid: streamSid,
                  media: {
                    payload: data.audio
                  }
                };
                twilioSocket.send(JSON.stringify(mediaMessage));
              }
              break;
              
            case "agent_response":
              console.log("Agent response:", data.text);
              break;
              
            case "user_transcript":
              console.log("User said:", data.text);
              break;
              
            case "conversation_ended":
              console.log("Conversation ended by ElevenLabs");
              twilioSocket.close();
              break;
              
            case "error":
              console.error("ElevenLabs error:", data);
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

  twilioSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case "start":
          // Twilio stream started
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;
          console.log(`Stream started: ${streamSid}, Call: ${callSid}`);
          break;

        case "media":
          // Audio from caller, forward to ElevenLabs
          if (elevenLabsSocket?.readyState === WebSocket.OPEN) {
            const audioMessage = {
              type: "audio",
              audio: data.media.payload // Already base64 mulaw
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
