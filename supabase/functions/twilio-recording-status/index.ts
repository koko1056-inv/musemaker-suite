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

    // Get params from query string
    const url = new URL(req.url);
    const outboundCallId = url.searchParams.get('outboundCallId');
    const queryCallSid = url.searchParams.get('callSid');
    const queryAgentId = url.searchParams.get('agentId');

    // Parse Twilio's form data
    const formData = await req.formData();
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const callSid = formData.get('CallSid') as string || queryCallSid;

    console.log(`Recording status callback: ${recordingStatus}, SID: ${recordingSid}, CallSid: ${callSid}, OutboundCallId: ${outboundCallId}, AgentId: ${queryAgentId}`);

    if (recordingStatus === 'completed' && recordingUrl) {
      // Twilio recording URL - add .mp3 extension for direct playback
      const audioUrl = `${recordingUrl}.mp3`;
      
      console.log(`Recording completed: ${audioUrl}, duration: ${recordingDuration}s`);

      // Case 1: Outbound call with outboundCallId
      if (outboundCallId && outboundCallId !== '') {
        const { data: outboundCall, error: fetchError } = await supabase
          .from('outbound_calls')
          .select('conversation_id')
          .eq('id', outboundCallId)
          .single();

        if (fetchError) {
          console.error('Error fetching outbound call:', fetchError);
        } else if (outboundCall?.conversation_id) {
          await supabase
            .from('conversations')
            .update({ audio_url: audioUrl })
            .eq('id', outboundCall.conversation_id);
          console.log(`Updated conversation ${outboundCall.conversation_id} with audio URL`);
        } else {
          // Store in outbound_calls metadata as fallback
          const { data: currentCall } = await supabase
            .from('outbound_calls')
            .select('metadata')
            .eq('id', outboundCallId)
            .single();

          const updatedMetadata = {
            ...(currentCall?.metadata as Record<string, unknown> || {}),
            recording_url: audioUrl,
            recording_sid: recordingSid,
            recording_duration: recordingDuration,
          };

          await supabase
            .from('outbound_calls')
            .update({ metadata: updatedMetadata })
            .eq('id', outboundCallId);
          console.log(`Stored recording URL in outbound_calls metadata for ${outboundCallId}`);
        }
      } 
      // Case 2: Find by call_sid (works for both inbound and outbound)
      else if (callSid) {
        // First try to find in outbound_calls
        const { data: outboundCall } = await supabase
          .from('outbound_calls')
          .select('id, conversation_id')
          .eq('call_sid', callSid)
          .single();

        if (outboundCall) {
          if (outboundCall.conversation_id) {
            await supabase
              .from('conversations')
              .update({ audio_url: audioUrl })
              .eq('id', outboundCall.conversation_id);
            console.log(`Updated conversation ${outboundCall.conversation_id} with audio URL via call_sid`);
          } else {
            const { data: currentCall } = await supabase
              .from('outbound_calls')
              .select('metadata')
              .eq('id', outboundCall.id)
              .single();

            const updatedMetadata = {
              ...(currentCall?.metadata as Record<string, unknown> || {}),
              recording_url: audioUrl,
              recording_sid: recordingSid,
              recording_duration: recordingDuration,
            };

            await supabase
              .from('outbound_calls')
              .update({ metadata: updatedMetadata })
              .eq('id', outboundCall.id);
          }
        } else {
          // This is likely an inbound call - find conversation by call_sid in metadata
          const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id, metadata')
            .filter('metadata->call_sid', 'eq', callSid)
            .limit(1);

          if (!convError && conversations && conversations.length > 0) {
            await supabase
              .from('conversations')
              .update({ audio_url: audioUrl })
              .eq('id', conversations[0].id);
            console.log(`Updated inbound conversation ${conversations[0].id} with audio URL`);
          } else {
            // Try finding by agent_id and recent timestamp as fallback
            if (queryAgentId) {
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
              const { data: recentConversations } = await supabase
                .from('conversations')
                .select('id')
                .eq('agent_id', queryAgentId)
                .gte('ended_at', fiveMinutesAgo)
                .is('audio_url', null)
                .order('ended_at', { ascending: false })
                .limit(1);

              if (recentConversations && recentConversations.length > 0) {
                await supabase
                  .from('conversations')
                  .update({ audio_url: audioUrl })
                  .eq('id', recentConversations[0].id);
                console.log(`Updated recent conversation ${recentConversations[0].id} with audio URL (fallback)`);
              } else {
                console.log('No matching conversation found for recording');
              }
            }
          }
        }
      }
    }

    // Return empty TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in twilio-recording-status:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  }
});
