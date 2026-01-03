import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const languageCode = formData.get('language_code') as string || 'jpn';

    if (!audioFile) {
      throw new Error('Audio file is required');
    }

    console.log(`Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);

    // Prepare form data for ElevenLabs API
    const apiFormData = new FormData();
    apiFormData.append('file', audioFile);
    apiFormData.append('model_id', 'scribe_v1');
    apiFormData.append('tag_audio_events', 'true');
    apiFormData.append('diarize', 'true');
    apiFormData.append('language_code', languageCode);

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT API error:', response.status, errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const transcription = await response.json();
    console.log('Transcription completed successfully');

    return new Response(JSON.stringify(transcription), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in elevenlabs-transcribe function:', error);
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
