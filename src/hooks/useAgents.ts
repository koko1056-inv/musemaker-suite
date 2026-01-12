import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;
type AgentInsert = TablesInsert<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

// Agent config for ElevenLabs sync
interface ElevenLabsAgentConfig {
  name: string;
  description?: string;
  voice_id: string;
  system_prompt?: string;
  first_message?: string;
  vad_mode?: string;
  vad_threshold?: number;
  vad_silence_duration_ms?: number;
  vad_prefix_padding_ms?: number;
}

// Helper function to sync agent with ElevenLabs
async function syncWithElevenLabs(
  action: 'create' | 'update' | 'delete' | 'sync_knowledge',
  agentConfig?: ElevenLabsAgentConfig,
  elevenlabsAgentId?: string,
  agentId?: string
): Promise<{ agent_id: string | null; knowledge_items_count?: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('elevenlabs-agent-sync', {
      body: { action, agentConfig, elevenlabsAgentId, agentId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { 
      agent_id: data?.agent_id || null,
      knowledge_items_count: data?.knowledge_items_count
    };
  } catch (error) {
    console.error(`Failed to ${action} agent on ElevenLabs:`, error);
    throw error;
  }
}

import { DEMO_WORKSPACE_ID } from '@/lib/workspace';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to access current agents in callbacks without adding to dependencies
  const agentsRef = useRef<Agent[]>([]);
  agentsRef.current = agents;

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
      // First, create the agent on ElevenLabs (without knowledge base - it will be synced after)
      const result = await syncWithElevenLabs('create', {
        name: agent.name,
        description: agent.description || undefined,
        voice_id: agent.voice_id || 'EXAVITQu4vr4xnSDxMaL',
        system_prompt: (agent as any).system_prompt || undefined,
        first_message: (agent as any).first_message || undefined,
        vad_mode: (agent as any).vad_mode || 'server_vad',
        vad_threshold: (agent as any).vad_threshold ?? 0.5,
        vad_silence_duration_ms: (agent as any).vad_silence_duration_ms ?? 500,
        vad_prefix_padding_ms: (agent as any).vad_prefix_padding_ms ?? 300,
      });

      // Then save to database with the ElevenLabs agent ID
      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...agent,
          workspace_id: DEMO_WORKSPACE_ID,
          elevenlabs_agent_id: result.agent_id,
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

  const moveToFolder = useCallback(async (agentId: string, folderId: string | null) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update({ folder_id: folderId })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => prev.map(a => a.id === agentId ? data : a));
      toast.success(folderId ? 'フォルダに移動しました' : 'フォルダから削除しました');
      return data;
    } catch (error) {
      console.error('Error moving agent to folder:', error);
      toast.error('フォルダへの移動に失敗しました');
      throw error;
    }
  }, []);

  const updateAgent = useCallback(async (id: string, updates: AgentUpdate) => {
    try {
      // Get current agent from ref to avoid stale closure
      const currentAgent = agentsRef.current.find(a => a.id === id);
      
      // Sync with ElevenLabs if agent has an elevenlabs_agent_id
      if (currentAgent?.elevenlabs_agent_id) {
        await syncWithElevenLabs('update', {
          name: updates.name || currentAgent.name,
          description: updates.description || currentAgent.description || undefined,
          voice_id: updates.voice_id || currentAgent.voice_id,
          system_prompt: (updates as any).system_prompt || (currentAgent as any).system_prompt || undefined,
          first_message: (updates as any).first_message ?? (currentAgent as any).first_message ?? undefined,
          vad_mode: (updates as any).vad_mode || (currentAgent as any).vad_mode || 'server_vad',
          vad_threshold: (updates as any).vad_threshold ?? (currentAgent as any).vad_threshold ?? 0.5,
          vad_silence_duration_ms: (updates as any).vad_silence_duration_ms ?? (currentAgent as any).vad_silence_duration_ms ?? 500,
          vad_prefix_padding_ms: (updates as any).vad_prefix_padding_ms ?? (currentAgent as any).vad_prefix_padding_ms ?? 300,
        }, currentAgent.elevenlabs_agent_id, id);
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
  }, []);

  const deleteAgent = useCallback(async (id: string) => {
    try {
      // Get current agent from ref to avoid stale closure
      const currentAgent = agentsRef.current.find(a => a.id === id);
      
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
  }, []);

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

  const syncKnowledgeBase = useCallback(async (id: string) => {
    try {
      const agent = agentsRef.current.find(a => a.id === id);
      if (!agent?.elevenlabs_agent_id) {
        throw new Error('エージェントがElevenLabsと同期されていません');
      }

      const result = await syncWithElevenLabs(
        'sync_knowledge',
        {
          name: agent.name,
          description: agent.description || undefined,
          voice_id: agent.voice_id,
          system_prompt: (agent as any).system_prompt || undefined,
        },
        agent.elevenlabs_agent_id,
        id
      );

      toast.success(`ナレッジベースを同期しました（${result.knowledge_items_count || 0}件）`);
      return result;
    } catch (error) {
      console.error('Error syncing knowledge base:', error);
      toast.error('ナレッジベースの同期に失敗しました');
      throw error;
    }
  }, []);

  // Sync knowledge base using ElevenLabs Knowledge Base API (document-based)
  const syncKnowledgeBaseAPI = useCallback(async (id: string) => {
    try {
      const agent = agentsRef.current.find(a => a.id === id);
      if (!agent?.elevenlabs_agent_id) {
        throw new Error('エージェントがElevenLabsと同期されていません');
      }

      // Get linked knowledge bases and their items
      const { data: links, error: linksError } = await supabase
        .from('agent_knowledge_bases')
        .select('knowledge_base_id')
        .eq('agent_id', id);

      if (linksError) throw linksError;

      const kbIds = links?.map(l => l.knowledge_base_id) || [];
      
      if (kbIds.length === 0) {
        toast.info('リンクされたナレッジベースがありません');
        return { documents_count: 0 };
      }

      // Get all knowledge items with their ElevenLabs document IDs
      const { data: items, error: itemsError } = await supabase
        .from('knowledge_items')
        .select('id, title, elevenlabs_document_id')
        .in('knowledge_base_id', kbIds)
        .not('elevenlabs_document_id', 'is', null);

      if (itemsError) throw itemsError;

      // Build document IDs array for sync
      const documentIds = (items || []).map(item => ({
        id: item.elevenlabs_document_id!,
        name: item.title,
        type: 'text' as const,
      }));

      if (documentIds.length === 0) {
        toast.info('同期可能なドキュメントがありません。ナレッジアイテムを追加してください。');
        return { documents_count: 0 };
      }

      // Sync to ElevenLabs agent
      const { data, error } = await supabase.functions.invoke('elevenlabs-knowledge-sync', {
        body: { 
          action: 'sync_agent',
          agentId: id,
          elevenlabsAgentId: agent.elevenlabs_agent_id,
          documentIds,
        }
      });

      if (error) throw error;

      toast.success(`ElevenLabs Knowledge Baseと同期しました（${documentIds.length}件のドキュメント）`);
      return { documents_count: documentIds.length };
    } catch (error) {
      console.error('Error syncing knowledge base API:', error);
      toast.error('Knowledge Base APIの同期に失敗しました');
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
    moveToFolder,
    syncKnowledgeBase,
    syncKnowledgeBaseAPI,
  };
}
