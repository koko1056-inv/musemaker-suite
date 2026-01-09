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

    // Return TwiML that connects to our WebSocket media stream handler
    // The WebSocket handler will bridge Twilio to ElevenLabs
    const wsUrl = supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    // Encode & as &amp; for valid XML
    const mediaStreamUrl = `${wsUrl}/functions/v1/twilio-media-stream?agentId=${agentId}&amp;outboundCallId=${outboundCallId || ''}`;
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${mediaStreamUrl}">
      <Parameter name="agentId" value="${agent.elevenlabs_agent_id}"/>
      <Parameter name="outboundCallId" value="${outboundCallId || ''}"/>
    </Stream>
  </Connect>
</Response>`;

    console.log('Returning TwiML with media stream URL:', mediaStreamUrl);

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in twilio-voice-handler:', error);
    
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
