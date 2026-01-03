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
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const audioFiles = formData.getAll('files') as File[];

    if (!name) {
      throw new Error('Voice name is required');
    }

    if (audioFiles.length === 0) {
      throw new Error('At least one audio file is required');
    }

    console.log(`Creating voice clone: ${name} with ${audioFiles.length} audio files`);

    // Prepare form data for ElevenLabs API
    const apiFormData = new FormData();
    apiFormData.append('name', name);
    apiFormData.append('description', description);
    
    // Add all audio files
    for (const file of audioFiles) {
      apiFormData.append('files', file);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Voice Clone API error:', response.status, errorText);
      throw new Error(`Voice cloning failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Voice clone created successfully:', result.voice_id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in elevenlabs-voice-clone function:', error);
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
