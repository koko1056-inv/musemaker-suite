import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface KnowledgeItem {
  title: string;
  content: string;
  category: string | null;
}

async function getKnowledgeBaseContent(supabase: any, agentId: string): Promise<string> {
  try {
    // Get linked knowledge bases
    const { data: links, error: linksError } = await supabase
      .from('agent_knowledge_bases')
      .select('knowledge_base_id')
      .eq('agent_id', agentId);

    if (linksError || !links || links.length === 0) {
      console.log('No knowledge bases linked to this agent');
      return '';
    }

    const kbIds = links.map((l: any) => l.knowledge_base_id);

    // Get all knowledge items from linked knowledge bases
    const { data: items, error: itemsError } = await supabase
      .from('knowledge_items')
      .select('title, content, category')
      .in('knowledge_base_id', kbIds);

    if (itemsError || !items || items.length === 0) {
      console.log('No knowledge items found');
      return '';
    }

    // Format knowledge items for the prompt
    const formattedItems = items.map((item: KnowledgeItem) => {
      const category = item.category ? `[${item.category}] ` : '';
      return `### ${category}${item.title}\n${item.content}`;
    }).join('\n\n');

    console.log(`Loaded ${items.length} knowledge items for agent`);

    return `

【参照可能なナレッジベース】
以下の情報を参照して、お客様の質問に正確に回答してください。
ナレッジベースに記載されていない内容については、「確認してお答えします」と伝えてください。

${formattedItems}

【回答時の注意】
- ナレッジベースの情報を優先して回答してください
- 情報がない場合は推測せず、確認が必要な旨を伝えてください
- FAQに記載がある質問には、その内容に沿って回答してください
`;
  } catch (error) {
    console.error('Error fetching knowledge base content:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }

    const { action, agentConfig, elevenlabsAgentId, agentId } = await req.json();

    console.log(`Processing ${action} action for agent`, { agentId, elevenlabsAgentId });

    // For delete action, we don't need agent config or knowledge
    if (action === 'delete') {
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
    }

    // For other actions, we need agentConfig
    if (!agentConfig) {
      throw new Error('Agent config is required for this action');
    }

    // Initialize Supabase client for fetching knowledge base
    let knowledgeContent = '';
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && agentId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      knowledgeContent = await getKnowledgeBaseContent(supabase, agentId);
    }

    // Build the full system prompt with knowledge base content
    const basePrompt = agentConfig.system_prompt || 
      `あなたは${agentConfig.name}です。${agentConfig.description || 'お客様のサポートを行うAIアシスタントです。'}`;
    
    const fullPrompt = basePrompt + knowledgeContent;

    console.log('Full prompt length:', fullPrompt.length);

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
                prompt: fullPrompt,
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
                prompt: fullPrompt,
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

      console.log('Agent updated successfully with knowledge base content');

      return new Response(JSON.stringify({ 
        success: true, 
        agent_id: elevenlabsAgentId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'sync_knowledge') {
      // Sync knowledge base content to existing agent
      if (!elevenlabsAgentId) {
        throw new Error('ElevenLabs agent ID is required for knowledge sync');
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${elevenlabsAgentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                prompt: fullPrompt,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs sync knowledge error:', response.status, errorText);
        throw new Error(`Failed to sync knowledge: ${response.status} - ${errorText}`);
      }

      console.log('Knowledge base synced successfully');

      return new Response(JSON.stringify({ 
        success: true,
        knowledge_items_count: knowledgeContent ? knowledgeContent.split('###').length - 1 : 0
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
