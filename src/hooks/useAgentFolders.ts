import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEMO_WORKSPACE_ID } from '@/lib/workspace';

export interface AgentFolder {
  id: string;
  name: string;
  workspace_id: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useAgentFolders() {
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['agent-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_folders')
        .select('*')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as AgentFolder[];
    },
    staleTime: 60000, // 1 minute
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, color = '#6366f1' }: { name: string; color?: string }) => {
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
      return data as AgentFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-folders'] });
      toast.success('フォルダを作成しました');
    },
    onError: (error) => {
      console.error('Error creating folder:', error);
      toast.error('フォルダの作成に失敗しました');
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<AgentFolder, 'name' | 'color'>> }) => {
      const { data, error } = await supabase
        .from('agent_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AgentFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-folders'] });
      toast.success('フォルダを更新しました');
    },
    onError: (error) => {
      console.error('Error updating folder:', error);
      toast.error('フォルダの更新に失敗しました');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agent_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-folders'] });
      toast.success('フォルダを削除しました');
    },
    onError: (error) => {
      console.error('Error deleting folder:', error);
      toast.error('フォルダの削除に失敗しました');
    },
  });

  const createFolder = useCallback(
    (name: string, color?: string) => createFolderMutation.mutateAsync({ name, color }),
    [createFolderMutation]
  );

  const updateFolder = useCallback(
    (id: string, updates: Partial<Pick<AgentFolder, 'name' | 'color'>>) =>
      updateFolderMutation.mutateAsync({ id, updates }),
    [updateFolderMutation]
  );

  const deleteFolder = useCallback(
    (id: string) => deleteFolderMutation.mutateAsync(id),
    [deleteFolderMutation]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agent-folders'] });
  }, [queryClient]);

  return {
    folders,
    isLoading,
    refetch,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
