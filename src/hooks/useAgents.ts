import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;
type AgentInsert = TablesInsert<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

// Helper function to sync agent with ElevenLabs
async function syncWithElevenLabs(
  action: 'create' | 'update' | 'delete',
  agentConfig?: { name: string; description?: string; voice_id: string; system_prompt?: string },
  elevenlabsAgentId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('elevenlabs-agent-sync', {
      body: { action, agentConfig, elevenlabsAgentId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data?.agent_id || null;
  } catch (error) {
    console.error(`Failed to ${action} agent on ElevenLabs:`, error);
    throw error;
  }
}

// Demo workspace ID for development
const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('エージェントの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = useCallback(async (agent: Omit<AgentInsert, 'workspace_id'>) => {
    try {
      // First, create the agent on ElevenLabs
      const elevenlabsAgentId = await syncWithElevenLabs('create', {
        name: agent.name,
        description: agent.description || undefined,
        voice_id: agent.voice_id || 'EXAVITQu4vr4xnSDxMaL',
        system_prompt: (agent as any).system_prompt || undefined,
      });

      // Then save to database with the ElevenLabs agent ID
      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...agent,
          workspace_id: DEMO_WORKSPACE_ID,
          elevenlabs_agent_id: elevenlabsAgentId,
        })
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => [data, ...prev]);
      toast.success('エージェントを作成し、ElevenLabsと同期しました');
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('エージェントの作成に失敗しました');
      throw error;
    }
  }, []);

  const updateAgent = useCallback(async (id: string, updates: AgentUpdate) => {
    try {
      // Get current agent to check if it has an ElevenLabs agent ID
      const currentAgent = agents.find(a => a.id === id);
      
      // Sync with ElevenLabs if agent has an elevenlabs_agent_id
      if (currentAgent?.elevenlabs_agent_id) {
        await syncWithElevenLabs('update', {
          name: updates.name || currentAgent.name,
          description: updates.description || currentAgent.description || undefined,
          voice_id: updates.voice_id || currentAgent.voice_id,
          system_prompt: (updates as any).system_prompt || (currentAgent as any).system_prompt || undefined,
        }, currentAgent.elevenlabs_agent_id);
      }

      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => prev.map(a => a.id === id ? data : a));
      toast.success('エージェントを更新しました');
      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('エージェントの更新に失敗しました');
      throw error;
    }
  }, [agents]);

  const deleteAgent = useCallback(async (id: string) => {
    try {
      // Get current agent to check if it has an ElevenLabs agent ID
      const currentAgent = agents.find(a => a.id === id);
      
      // Try to delete from ElevenLabs first (don't fail if this fails)
      if (currentAgent?.elevenlabs_agent_id) {
        try {
          await syncWithElevenLabs('delete', undefined, currentAgent.elevenlabs_agent_id);
        } catch (e) {
          console.warn('Could not delete agent from ElevenLabs:', e);
        }
      }

      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAgents(prev => prev.filter(a => a.id !== id));
      toast.success('エージェントを削除しました');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('エージェントの削除に失敗しました');
      throw error;
    }
  }, [agents]);

  const getAgent = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agent:', error);
      toast.error('エージェントの取得に失敗しました');
      throw error;
    }
  }, []);

  return {
    agents,
    isLoading,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
  };
}
