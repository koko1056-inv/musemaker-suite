import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const outboundCallId = url.searchParams.get('outboundCallId');

    if (!agentId) {
      console.error('Missing agentId parameter');
      // Return TwiML error response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">エラーが発生しました。エージェントIDが指定されていません。</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Handling voice request for agent ${agentId}, outbound call ${outboundCallId}`);

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, elevenlabs_agent_id, workspace_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">エラーが発生しました。エージェントが見つかりません。</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Get workspace to get ElevenLabs API key
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('elevenlabs_api_key')
      .eq('id', agent.workspace_id)
      .single();

    if (workspaceError || !workspace?.elevenlabs_api_key) {
      console.error('Workspace or ElevenLabs API key not found:', workspaceError);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">エラーが発生しました。ElevenLabsの設定が必要です。</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    if (!agent.elevenlabs_agent_id) {
      console.error('Agent does not have ElevenLabs agent ID');
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">エラーが発生しました。このエージェントはまだElevenLabsに同期されていません。</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Get a signed URL for the ElevenLabs conversation
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agent.elevenlabs_agent_id}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': workspace.elevenlabs_api_key,
        },
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('Failed to get ElevenLabs signed URL:', errorText);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">エラーが発生しました。AIエージェントへの接続に失敗しました。</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const { signed_url } = await elevenLabsResponse.json();
    console.log('Got ElevenLabs signed URL for agent:', agent.elevenlabs_agent_id);

    // Return TwiML that connects to ElevenLabs via WebSocket
    // Using <Connect><Stream> to stream audio to ElevenLabs
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${signed_url}">
      <Parameter name="agentId" value="${agent.elevenlabs_agent_id}"/>
      <Parameter name="outboundCallId" value="${outboundCallId || ''}"/>
    </Stream>
  </Connect>
</Response>`;

    console.log('Returning TwiML with ElevenLabs stream connection');

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in twilio-voice-handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">アプリケーションエラーが発生しました。しばらくしてからもう一度お試しください。</Say>
  <Hangup/>
</Response>`;
    
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
