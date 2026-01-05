import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const outboundCallId = url.searchParams.get('outboundCallId');

    if (!outboundCallId) {
      console.error('Missing outboundCallId');
      return new Response('Missing outboundCallId', { status: 400 });
    }

    // Parse form data from Twilio
    const formData = await req.formData();
    const callStatus = formData.get('CallStatus') as string;
    const callSid = formData.get('CallSid') as string;
    const callDuration = formData.get('CallDuration') as string;

    console.log(`Call status update for ${outboundCallId}: ${callStatus}`);

    // Map Twilio status to our status
    let status = 'in_progress';
    let result = null;
    let endedAt = null;

    switch (callStatus) {
      case 'queued':
      case 'ringing':
        status = 'ringing';
        break;
      case 'in-progress':
        status = 'in_progress';
        break;
      case 'completed':
        status = 'completed';
        result = 'answered';
        endedAt = new Date().toISOString();
        break;
      case 'busy':
        status = 'completed';
        result = 'busy';
        endedAt = new Date().toISOString();
        break;
      case 'no-answer':
        status = 'completed';
        result = 'no_answer';
        endedAt = new Date().toISOString();
        break;
      case 'canceled':
        status = 'canceled';
        endedAt = new Date().toISOString();
        break;
      case 'failed':
        status = 'failed';
        result = 'failed';
        endedAt = new Date().toISOString();
        break;
      default:
        status = callStatus;
    }

    const updateData: Record<string, unknown> = {
      status,
      call_sid: callSid,
    };

    if (result) updateData.result = result;
    if (endedAt) updateData.ended_at = endedAt;
    if (callDuration) updateData.duration_seconds = parseInt(callDuration, 10);

    const { error } = await supabase
      .from('outbound_calls')
      .update(updateData)
      .eq('id', outboundCallId);

    if (error) {
      console.error('Failed to update outbound call:', error);
    }

    // Return empty TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in twilio-call-status:', error);
    return new Response('Error processing status', { status: 500 });
  }
});
