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

    // Get outboundCallId from query params
    const url = new URL(req.url);
    const outboundCallId = url.searchParams.get('outboundCallId');

    // Parse Twilio's form data
    const formData = await req.formData();
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const callSid = formData.get('CallSid') as string;

    console.log(`Recording status callback: ${recordingStatus}, SID: ${recordingSid}, CallSid: ${callSid}, OutboundCallId: ${outboundCallId}`);

    if (recordingStatus === 'completed' && recordingUrl) {
      // Twilio recording URL - add .mp3 extension for direct playback
      const audioUrl = `${recordingUrl}.mp3`;
      
      console.log(`Recording completed: ${audioUrl}, duration: ${recordingDuration}s`);

      // Update conversation with audio URL if we have outboundCallId
      if (outboundCallId) {
        // Get the conversation_id from outbound_calls
        const { data: outboundCall, error: fetchError } = await supabase
          .from('outbound_calls')
          .select('conversation_id')
          .eq('id', outboundCallId)
          .single();

        if (fetchError) {
          console.error('Error fetching outbound call:', fetchError);
        } else if (outboundCall?.conversation_id) {
          // Update the conversation with the audio URL
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ audio_url: audioUrl })
            .eq('id', outboundCall.conversation_id);

          if (updateError) {
            console.error('Error updating conversation audio_url:', updateError);
          } else {
            console.log(`Updated conversation ${outboundCall.conversation_id} with audio URL`);
          }
        } else {
          console.log('No conversation_id found for outbound call, storing URL in metadata');
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
        }
      } else if (callSid) {
        // Try to find outbound call by call_sid
        const { data: outboundCall, error: fetchError } = await supabase
          .from('outbound_calls')
          .select('id, conversation_id')
          .eq('call_sid', callSid)
          .single();

        if (!fetchError && outboundCall) {
          if (outboundCall.conversation_id) {
            await supabase
              .from('conversations')
              .update({ audio_url: audioUrl })
              .eq('id', outboundCall.conversation_id);
            console.log(`Updated conversation ${outboundCall.conversation_id} with audio URL via call_sid`);
          } else {
            // Store in metadata
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
