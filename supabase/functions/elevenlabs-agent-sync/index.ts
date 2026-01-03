import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentConfig {
  name: string;
  description?: string;
  voice_id: string;
  system_prompt?: string;
  max_call_duration?: number;
}

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

    const { action, agentConfig, elevenlabsAgentId } = await req.json();

    console.log(`Processing ${action} action for agent`);

    if (action === 'create') {
      // Create a new agent on ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agentConfig.name,
          conversation_config: {
            agent: {
              prompt: {
                prompt: agentConfig.system_prompt || `あなたは${agentConfig.name}です。${agentConfig.description || 'お客様のサポートを行うAIアシスタントです。'}`,
              },
              first_message: 'こんにちは！本日はどのようなご用件でしょうか？',
              language: 'ja',
            },
            tts: {
              model_id: 'eleven_turbo_v2_5',
              voice_id: agentConfig.voice_id,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs create agent error:', response.status, errorText);
        throw new Error(`Failed to create agent: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Agent created successfully:', data);

      return new Response(JSON.stringify({ 
        success: true, 
        agent_id: data.agent_id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'update') {
      if (!elevenlabsAgentId) {
        throw new Error('ElevenLabs agent ID is required for update');
      }

      // Update existing agent on ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${elevenlabsAgentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agentConfig.name,
          conversation_config: {
            agent: {
              prompt: {
                prompt: agentConfig.system_prompt || `あなたは${agentConfig.name}です。${agentConfig.description || 'お客様のサポートを行うAIアシスタントです。'}`,
              },
              language: 'ja',
            },
            tts: {
              model_id: 'eleven_turbo_v2_5',
              voice_id: agentConfig.voice_id,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs update agent error:', response.status, errorText);
        throw new Error(`Failed to update agent: ${response.status} - ${errorText}`);
      }

      console.log('Agent updated successfully');

      return new Response(JSON.stringify({ 
        success: true, 
        agent_id: elevenlabsAgentId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'delete') {
      if (!elevenlabsAgentId) {
        throw new Error('ElevenLabs agent ID is required for delete');
      }

      // Delete agent from ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${elevenlabsAgentId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs delete agent error:', response.status, errorText);
        // Don't throw error for delete - agent might already be deleted
        console.warn('Could not delete agent from ElevenLabs, continuing anyway');
      }

      console.log('Agent deleted successfully');

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    console.error('Error in elevenlabs-agent-sync function:', error);
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
