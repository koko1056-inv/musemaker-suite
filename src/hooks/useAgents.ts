import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;
type AgentInsert = TablesInsert<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

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
      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...agent,
          workspace_id: DEMO_WORKSPACE_ID,
        })
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => [data, ...prev]);
      toast.success('エージェントを作成しました');
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('エージェントの作成に失敗しました');
      throw error;
    }
  }, []);

  const updateAgent = useCallback(async (id: string, updates: AgentUpdate) => {
    try {
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
