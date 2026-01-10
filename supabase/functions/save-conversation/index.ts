import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const agentId = formData.get('agentId') as string;
    const phoneNumber = formData.get('phoneNumber') as string | null;
    const transcriptJson = formData.get('transcript') as string;
    const durationSeconds = parseInt(formData.get('durationSeconds') as string || '0', 10);
    const outcome = formData.get('outcome') as string | null;
    const status = formData.get('status') as string || 'completed';
    const audioFile = formData.get('audio') as File | null;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    console.log(`Saving conversation for agent: ${agentId}`);

    let audioUrl: string | null = null;

    // Upload audio if provided
    if (audioFile && audioFile.size > 0) {
      const fileName = `${agentId}/${Date.now()}.webm`;
      console.log(`Uploading audio file: ${fileName}, size: ${audioFile.size} bytes`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(fileName, audioFile, {
          contentType: audioFile.type || 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('call-recordings')
        .getPublicUrl(fileName);
      
      audioUrl = urlData.publicUrl;
      console.log(`Audio uploaded successfully: ${audioUrl}`);
    }

    // Parse transcript
    let transcript: any[] = [];
    try {
      transcript = transcriptJson ? JSON.parse(transcriptJson) : [];
    } catch (e) {
      console.error('Error parsing transcript:', e);
    }

    // Insert conversation record
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        phone_number: phoneNumber || null,
        transcript: transcript,
        duration_seconds: durationSeconds,
        outcome: outcome,
        status: status,
        audio_url: audioUrl,
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to save conversation: ${error.message}`);
    }

    console.log('Conversation saved successfully:', data.id);

    // Get agent info for notifications
    const { data: agent } = await supabase
      .from('agents')
      .select('name, workspace_id')
      .eq('id', agentId)
      .single();

    const workspaceId = agent?.workspace_id;
    const agentName = agent?.name || 'AIエージェント';

    // Determine event type based on status
    const eventType = status === 'failed' ? 'call_failed' : 'call_end';

    // Trigger webhooks, notifications, and summary generation asynchronously
    const backgroundTasks = async () => {
      try {
        // Trigger webhooks
        await fetch(`${supabaseUrl}/functions/v1/send-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            conversationId: data.id,
            agentId: agentId,
          }),
        });
      } catch (webhookError) {
        console.error('Error triggering webhooks:', webhookError);
      }

      try {
        // Generate AI summary
        await fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            conversationId: data.id,
          }),
        });
      } catch (summaryError) {
        console.error('Error generating summary:', summaryError);
      }

      // Send Slack notifications
      if (workspaceId) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-slack-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              workspace_id: workspaceId,
              event_type: eventType,
              agent_name: agentName,
              phone_number: phoneNumber,
              duration_seconds: durationSeconds,
              outcome: outcome,
              transcript: transcript,
            }),
          });
          console.log('Slack notification triggered');
        } catch (slackError) {
          console.error('Error sending Slack notification:', slackError);
        }

        // Send email notifications
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              workspace_id: workspaceId,
              event_type: eventType,
              agent_name: agentName,
              phone_number: phoneNumber,
              duration_seconds: durationSeconds,
              outcome: outcome,
              transcript: transcript,
              conversation_id: data.id,
            }),
          });
          console.log('Email notification triggered');
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }

        // Export to spreadsheet
        try {
          await fetch(`${supabaseUrl}/functions/v1/export-to-spreadsheet`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              workspace_id: workspaceId,
              event_type: eventType,
              agent_id: agentId,
              agent_name: agentName,
              conversation_id: data.id,
              phone_number: phoneNumber,
              duration_seconds: durationSeconds,
              outcome: outcome,
              transcript: transcript,
            }),
          });
          console.log('Spreadsheet export triggered');
        } catch (spreadsheetError) {
          console.error('Error exporting to spreadsheet:', spreadsheetError);
        }
      }
    };

    // Run background tasks without blocking response
    backgroundTasks();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in save-conversation function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
