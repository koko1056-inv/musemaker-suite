import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }

    console.log('Fetching voices from ElevenLabs...');

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.voices?.length || 0} voices`);

    // Map to simplified voice data and separate cloned voices
    const voices = data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      labels: voice.labels,
      preview_url: voice.preview_url,
      isCloned: voice.category === 'cloned',
    }));

    // Sort: cloned voices first, then others
    voices.sort((a: any, b: any) => {
      if (a.isCloned && !b.isCloned) return -1;
      if (!a.isCloned && b.isCloned) return 1;
      return a.name.localeCompare(b.name);
    });

    return new Response(
      JSON.stringify({ voices }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error in elevenlabs-voices function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
