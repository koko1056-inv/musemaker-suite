import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgentFolder {
  id: string;
  name: string;
  workspace_id: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Demo workspace ID for development
const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export function useAgentFolders() {
  const [folders, setFolders] = useState<AgentFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_folders')
        .select('*')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('フォルダの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (name: string, color: string = '#6366f1') => {
    try {
      const { data, error } = await supabase
        .from('agent_folders')
        .insert({
          name,
          color,
          workspace_id: DEMO_WORKSPACE_ID,
        })
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('フォルダを作成しました');
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('フォルダの作成に失敗しました');
      throw error;
    }
  }, []);

  const updateFolder = useCallback(async (id: string, updates: Partial<Pick<AgentFolder, 'name' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('agent_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => prev.map(f => f.id === id ? data : f).sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('フォルダを更新しました');
      return data;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('フォルダの更新に失敗しました');
      throw error;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFolders(prev => prev.filter(f => f.id !== id));
      toast.success('フォルダを削除しました');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('フォルダの削除に失敗しました');
      throw error;
    }
  }, []);

  return {
    folders,
    isLoading,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
