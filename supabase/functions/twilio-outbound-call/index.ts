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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workspaceId, agentId, toNumber, scheduledAt, metadata } = await req.json();

    if (!workspaceId || !agentId || !toNumber) {
      return new Response(
        JSON.stringify({ error: 'workspaceId, agentId, and toNumber are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Initiating outbound call for workspace ${workspaceId} to ${toNumber}`);

    // Get workspace Twilio credentials
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('twilio_account_sid, twilio_auth_token')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error('Workspace not found:', workspaceError);
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!workspace.twilio_account_sid || !workspace.twilio_auth_token) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured for this workspace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get a phone number assigned to this workspace
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('id, phone_number')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (phoneError || !phoneNumber) {
      console.error('No active phone number found:', phoneError);
      return new Response(
        JSON.stringify({ error: 'No active phone number found for this workspace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, elevenlabs_agent_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create outbound call record
    const { data: outboundCall, error: insertError } = await supabase
      .from('outbound_calls')
      .insert({
        workspace_id: workspaceId,
        agent_id: agentId,
        to_number: toNumber,
        phone_number_id: phoneNumber.id,
        scheduled_at: scheduledAt || null,
        metadata: metadata || null,
        status: scheduledAt ? 'scheduled' : 'initiating',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create outbound call record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create outbound call record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If scheduled for later, don't initiate the call now
    if (scheduledAt) {
      console.log(`Call scheduled for ${scheduledAt}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          outboundCallId: outboundCall.id,
          status: 'scheduled',
          scheduledAt 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initiate the call via Twilio
    const twilioAccountSid = workspace.twilio_account_sid;
    const twilioAuthToken = workspace.twilio_auth_token;
    
    // Create TwiML for the call
    const twimlUrl = `${supabaseUrl}/functions/v1/twilio-voice-handler?agentId=${agentId}&outboundCallId=${outboundCall.id}`;
    
    const formData = new URLSearchParams();
    formData.append('To', toNumber);
    formData.append('From', phoneNumber.phone_number);
    formData.append('Url', twimlUrl);
    formData.append('StatusCallback', `${supabaseUrl}/functions/v1/twilio-call-status?outboundCallId=${outboundCall.id}`);
    formData.append('StatusCallbackEvent', 'initiated ringing answered completed');

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio API error:', errorText);
      
      // Update call status to failed
      await supabase
        .from('outbound_calls')
        .update({ status: 'failed', result: errorText })
        .eq('id', outboundCall.id);

      return new Response(
        JSON.stringify({ error: 'Failed to initiate Twilio call', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioData = await twilioResponse.json();
    console.log('Twilio call initiated:', twilioData.sid);

    // Update call record with Twilio SID
    await supabase
      .from('outbound_calls')
      .update({ 
        call_sid: twilioData.sid,
        status: 'initiated',
        started_at: new Date().toISOString()
      })
      .eq('id', outboundCall.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        outboundCallId: outboundCall.id,
        callSid: twilioData.sid,
        status: 'initiated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in twilio-outbound-call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
