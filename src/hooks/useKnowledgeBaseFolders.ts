import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEMO_WORKSPACE_ID } from '@/lib/workspace';

export interface KnowledgeBaseFolder {
  id: string;
  name: string;
  workspace_id: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBaseFolders() {
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['knowledge-base-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base_folders')
        .select('*')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as KnowledgeBaseFolder[];
    },
    staleTime: 60000, // 1 minute
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('knowledge_base_folders')
        .insert({ name, color, workspace_id: DEMO_WORKSPACE_ID })
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeBaseFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-folders'] });
      toast.success('フォルダを作成しました');
    },
    onError: (error) => {
      console.error('Failed to create kb folder:', error);
      toast.error('フォルダの作成に失敗しました');
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<KnowledgeBaseFolder, 'name' | 'color'>> }) => {
      const { data, error } = await supabase
        .from('knowledge_base_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeBaseFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-folders'] });
      toast.success('フォルダを更新しました');
    },
    onError: (error) => {
      console.error('Failed to update kb folder:', error);
      toast.error('フォルダの更新に失敗しました');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_base_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-folders'] });
      toast.success('フォルダを削除しました');
    },
    onError: (error) => {
      console.error('Failed to delete kb folder:', error);
      toast.error('フォルダの削除に失敗しました');
    },
  });

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ kbId, folderId }: { kbId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from('knowledge_bases')
        .update({ folder_id: folderId })
        .eq('id', kbId);

      if (error) throw error;
      return { kbId, folderId };
    },
    onSuccess: ({ folderId }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      toast.success(folderId ? 'フォルダに移動しました' : 'フォルダから外しました');
    },
    onError: (error) => {
      console.error('Failed to move kb to folder:', error);
      toast.error('移動に失敗しました');
    },
  });

  const createFolder = useCallback(
    (name: string, color: string) => createFolderMutation.mutateAsync({ name, color }),
    [createFolderMutation]
  );

  const updateFolder = useCallback(
    (id: string, updates: Partial<Pick<KnowledgeBaseFolder, 'name' | 'color'>>) =>
      updateFolderMutation.mutateAsync({ id, updates }),
    [updateFolderMutation]
  );

  const deleteFolder = useCallback(
    (id: string) => deleteFolderMutation.mutateAsync(id),
    [deleteFolderMutation]
  );

  const moveToFolder = useCallback(
    (kbId: string, folderId: string | null) => moveToFolderMutation.mutateAsync({ kbId, folderId }),
    [moveToFolderMutation]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['knowledge-base-folders'] });
  }, [queryClient]);

  return {
    folders,
    isLoading,
    refetch,
    createFolder,
    updateFolder,
    deleteFolder,
    moveToFolder,
  };
}
