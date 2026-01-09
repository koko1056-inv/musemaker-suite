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

    // Parse Twilio request to get CallSid for inbound calls
    let callSid: string | null = null;
    let fromNumber: string | null = null;
    
    try {
      const formData = await req.formData();
      callSid = formData.get('CallSid') as string | null;
      fromNumber = formData.get('From') as string | null;
    } catch {
      // Not a form request, might be a direct call
    }

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

    const isInboundCall = !outboundCallId || outboundCallId === '';
    console.log(`Handling voice request for agent ${agentId}, outbound call ${outboundCallId}, inbound: ${isInboundCall}, callSid: ${callSid}`);

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
    const mediaStreamUrl = `${wsUrl}/functions/v1/twilio-media-stream`;
    
    // Recording callback URL - include callSid for inbound calls
    const recordingParams = outboundCallId 
      ? `outboundCallId=${outboundCallId}` 
      : `callSid=${callSid || ''}&agentId=${agentId}`;
    const recordingStatusCallback = `${supabaseUrl}/functions/v1/twilio-recording-status?${recordingParams}`;
    
    // Pass parameters via <Parameter> tags - Twilio sends these in the "start" event's customParameters
    // Use <Start> to enable recording alongside the stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Record 
      recordingStatusCallback="${recordingStatusCallback}"
      recordingStatusCallbackEvent="completed"
      recordingStatusCallbackMethod="POST"
    />
  </Start>
  <Connect>
    <Stream url="${mediaStreamUrl}">
      <Parameter name="agentId" value="${agentId}"/>
      <Parameter name="outboundCallId" value="${outboundCallId || ''}"/>
      <Parameter name="callSid" value="${callSid || ''}"/>
      <Parameter name="fromNumber" value="${fromNumber || ''}"/>
    </Stream>
  </Connect>
</Response>`;

    console.log('Returning TwiML with media stream URL:', mediaStreamUrl, 'agentId:', agentId, 'recording enabled');

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
