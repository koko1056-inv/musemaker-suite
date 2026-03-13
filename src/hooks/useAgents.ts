import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEMO_WORKSPACE_ID } from '@/lib/workspace';
import type { Agent, AgentInsert, AgentUpdate, AgentWithExtended, ElevenLabsAgentConfig } from '@/types/agents';

async function syncWithElevenLabs(
  action: 'create' | 'update' | 'delete' | 'sync_knowledge',
  agentConfig?: ElevenLabsAgentConfig,
  elevenlabsAgentId?: string,
  agentId?: string
): Promise<{ agent_id: string | null; knowledge_items_count?: number }> {
  const { data, error } = await supabase.functions.invoke('elevenlabs-agent-sync', {
    body: { action, agentConfig, elevenlabsAgentId, agentId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return {
    agent_id: data?.agent_id || null,
    knowledge_items_count: data?.knowledge_items_count,
  };
}

const AGENTS_QUERY_KEY = ['agents'] as const;

export function useAgents() {
  const queryClient = useQueryClient();
  const agentsRef = useRef<Agent[]>([]);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  agentsRef.current = agents;

  const createMutation = useMutation({
    mutationFn: async (agent: Omit<AgentInsert, 'workspace_id'>) => {
      const ext = agent as AgentWithExtended;
      const result = await syncWithElevenLabs('create', {
        name: agent.name,
        description: agent.description || undefined,
        voice_id: agent.voice_id || 'EXAVITQu4vr4xnSDxMaL',
        system_prompt: ext.system_prompt || undefined,
        first_message: ext.first_message || undefined,
        vad_mode: ext.vad_mode || 'server_vad',
        vad_threshold: ext.vad_threshold ?? 0.5,
        vad_silence_duration_ms: ext.vad_silence_duration_ms ?? 500,
        vad_prefix_padding_ms: ext.vad_prefix_padding_ms ?? 300,
      });

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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success('エージェントを作成し、ElevenLabsと同期しました');
    },
    onError: (error) => {
      console.error('Error creating agent:', error);
      toast.error('エージェントの作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AgentUpdate }) => {
      const currentAgent = agentsRef.current.find(a => a.id === id);
      const ext = updates as AgentWithExtended;
      const currentExt = currentAgent as AgentWithExtended | undefined;

      if (currentAgent?.elevenlabs_agent_id) {
        await syncWithElevenLabs('update', {
          name: updates.name || currentAgent.name,
          description: updates.description || currentAgent.description || undefined,
          voice_id: updates.voice_id || currentAgent.voice_id,
          system_prompt: ext.system_prompt || currentExt?.system_prompt || undefined,
          first_message: ext.first_message ?? currentExt?.first_message ?? undefined,
          vad_mode: ext.vad_mode || currentExt?.vad_mode || 'server_vad',
          vad_threshold: ext.vad_threshold ?? currentExt?.vad_threshold ?? 0.5,
          vad_silence_duration_ms: ext.vad_silence_duration_ms ?? currentExt?.vad_silence_duration_ms ?? 500,
          vad_prefix_padding_ms: ext.vad_prefix_padding_ms ?? currentExt?.vad_prefix_padding_ms ?? 300,
        }, currentAgent.elevenlabs_agent_id, id);
      }

      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success('エージェントを更新しました');
    },
    onError: (error) => {
      console.error('Error updating agent:', error);
      toast.error('エージェントの更新に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const currentAgent = agentsRef.current.find(a => a.id === id);

      if (currentAgent?.elevenlabs_agent_id) {
        try {
          await syncWithElevenLabs('delete', undefined, currentAgent.elevenlabs_agent_id);
        } catch (e) {
          console.warn('Could not delete agent from ElevenLabs:', e);
        }
      }

      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success('エージェントを削除しました');
    },
    onError: (error) => {
      console.error('Error deleting agent:', error);
      toast.error('エージェントの削除に失敗しました');
    },
  });

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ agentId, folderId }: { agentId: string; folderId: string | null }) => {
      const { data, error } = await supabase
        .from('agents')
        .update({ folder_id: folderId })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
      toast.success(folderId ? 'フォルダに移動しました' : 'フォルダから削除しました');
    },
    onError: (error) => {
      console.error('Error moving agent to folder:', error);
      toast.error('フォルダへの移動に失敗しました');
    },
  });

  const getAgent = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }, []);

  const syncKnowledgeBase = useCallback(async (id: string) => {
    const agent = agentsRef.current.find(a => a.id === id);
    if (!agent?.elevenlabs_agent_id) {
      throw new Error('エージェントがElevenLabsと同期されていません');
    }
    const ext = agent as AgentWithExtended;

    const result = await syncWithElevenLabs(
      'sync_knowledge',
      {
        name: agent.name,
        description: agent.description || undefined,
        voice_id: agent.voice_id,
        system_prompt: ext.system_prompt || undefined,
      },
      agent.elevenlabs_agent_id,
      id
    );

    toast.success(`ナレッジベースを同期しました（${result.knowledge_items_count || 0}件）`);
    return result;
  }, []);

  const syncKnowledgeBaseAPI = useCallback(async (id: string) => {
    const agent = agentsRef.current.find(a => a.id === id);
    if (!agent?.elevenlabs_agent_id) {
      throw new Error('エージェントがElevenLabsと同期されていません');
    }

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

    const { data: items, error: itemsError } = await supabase
      .from('knowledge_items')
      .select('id, title, elevenlabs_document_id')
      .in('knowledge_base_id', kbIds)
      .not('elevenlabs_document_id', 'is', null);

    if (itemsError) throw itemsError;

    const documentIds = (items || []).map(item => ({
      id: item.elevenlabs_document_id!,
      name: item.title,
      type: 'text' as const,
    }));

    if (documentIds.length === 0) {
      toast.info('同期可能なドキュメントがありません。ナレッジアイテムを追加してください。');
      return { documents_count: 0 };
    }

    const { data, error } = await supabase.functions.invoke('elevenlabs-knowledge-sync', {
      body: {
        action: 'sync_agent',
        agentId: id,
        elevenlabsAgentId: agent.elevenlabs_agent_id,
        documentIds,
      },
    });

    if (error) throw error;
    toast.success(`ElevenLabs Knowledge Baseと同期しました（${documentIds.length}件のドキュメント）`);
    return { documents_count: documentIds.length };
  }, []);

  // Maintain backwards-compatible API
  const createAgent = useCallback(
    (agent: Omit<AgentInsert, 'workspace_id'>) => createMutation.mutateAsync(agent),
    [createMutation]
  );
  const updateAgent = useCallback(
    (id: string, updates: AgentUpdate) => updateMutation.mutateAsync({ id, updates }),
    [updateMutation]
  );
  const deleteAgent = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );
  const moveToFolder = useCallback(
    (agentId: string, folderId: string | null) => moveToFolderMutation.mutateAsync({ agentId, folderId }),
    [moveToFolderMutation]
  );

  return {
    agents,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY }),
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    moveToFolder,
    syncKnowledgeBase,
    syncKnowledgeBaseAPI,
  };
}
