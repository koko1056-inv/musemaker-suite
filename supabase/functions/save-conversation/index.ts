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
