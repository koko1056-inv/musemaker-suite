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

    console.log('Processing scheduled calls...');

    // Get all scheduled calls that are due
    const now = new Date().toISOString();
    const { data: scheduledCalls, error: fetchError } = await supabase
      .from('outbound_calls')
      .select(`
        id,
        workspace_id,
        agent_id,
        to_number,
        phone_number_id,
        metadata
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(50); // Process up to 50 calls at a time

    if (fetchError) {
      console.error('Error fetching scheduled calls:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled calls' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scheduledCalls || scheduledCalls.length === 0) {
      console.log('No scheduled calls to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledCalls.length} scheduled calls to process`);

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const call of scheduledCalls) {
      try {
        // Update status to initiating
        await supabase
          .from('outbound_calls')
          .update({ status: 'initiating' })
          .eq('id', call.id);

        // Get workspace Twilio credentials
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .select('twilio_account_sid, twilio_auth_token')
          .eq('id', call.workspace_id)
          .single();

        if (workspaceError || !workspace?.twilio_account_sid || !workspace?.twilio_auth_token) {
          throw new Error('Twilio credentials not configured');
        }

        // Get phone number
        const { data: phoneNumber, error: phoneError } = await supabase
          .from('phone_numbers')
          .select('phone_number')
          .eq('id', call.phone_number_id)
          .single();

        if (phoneError || !phoneNumber) {
          throw new Error('Phone number not found');
        }

        // Initiate the call via Twilio
        const twimlUrl = `${supabaseUrl}/functions/v1/twilio-voice-handler?agentId=${call.agent_id}&outboundCallId=${call.id}`;
        
        const formData = new URLSearchParams();
        formData.append('To', call.to_number);
        formData.append('From', phoneNumber.phone_number);
        formData.append('Url', twimlUrl);
        formData.append('StatusCallback', `${supabaseUrl}/functions/v1/twilio-call-status?outboundCallId=${call.id}`);
        formData.append('StatusCallbackEvent', 'initiated');
        formData.append('StatusCallbackEvent', 'ringing');
        formData.append('StatusCallbackEvent', 'answered');
        formData.append('StatusCallbackEvent', 'completed');
        
        // Enable call recording
        formData.append('Record', 'true');
        formData.append('RecordingStatusCallback', `${supabaseUrl}/functions/v1/twilio-recording-status?outboundCallId=${call.id}`);
        formData.append('RecordingStatusCallbackEvent', 'completed');
        formData.append('RecordingChannels', 'dual');

        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${workspace.twilio_account_sid}/Calls.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${workspace.twilio_account_sid}:${workspace.twilio_auth_token}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          }
        );

        if (!twilioResponse.ok) {
          const errorText = await twilioResponse.text();
          throw new Error(`Twilio error: ${errorText}`);
        }

        const twilioData = await twilioResponse.json();
        console.log(`Call ${call.id} initiated with SID: ${twilioData.sid}`);

        // Update call record with Twilio SID
        await supabase
          .from('outbound_calls')
          .update({ 
            call_sid: twilioData.sid,
            status: 'initiated',
            started_at: new Date().toISOString()
          })
          .eq('id', call.id);

        results.push({ id: call.id, success: true });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process call ${call.id}:`, errorMessage);

        // Update call status to failed
        await supabase
          .from('outbound_calls')
          .update({ 
            status: 'failed', 
            result: errorMessage 
          })
          .eq('id', call.id);

        results.push({ id: call.id, success: false, error: errorMessage });
      }

      // Small delay between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(`Processed ${results.length} calls: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        successCount,
        failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-scheduled-calls:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
