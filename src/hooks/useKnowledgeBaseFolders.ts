import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KnowledgeBaseFolder {
  id: string;
  name: string;
  workspace_id: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function useKnowledgeBaseFolders() {
  const [folders, setFolders] = useState<KnowledgeBaseFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("knowledge_base_folders")
        .select("*")
        .eq("workspace_id", DEMO_WORKSPACE_ID)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error("Failed to fetch kb folders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string, color: string) => {
    try {
      const { error } = await supabase
        .from("knowledge_base_folders")
        .insert({ name, color, workspace_id: DEMO_WORKSPACE_ID });

      if (error) throw error;
      toast.success("フォルダを作成しました");
      fetchFolders();
    } catch (error) {
      console.error("Failed to create kb folder:", error);
      toast.error("フォルダの作成に失敗しました");
    }
  };

  const updateFolder = async (id: string, updates: Partial<Pick<KnowledgeBaseFolder, 'name' | 'color'>>) => {
    try {
      const { error } = await supabase
        .from("knowledge_base_folders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("フォルダを更新しました");
      fetchFolders();
    } catch (error) {
      console.error("Failed to update kb folder:", error);
      toast.error("フォルダの更新に失敗しました");
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from("knowledge_base_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("フォルダを削除しました");
      fetchFolders();
    } catch (error) {
      console.error("Failed to delete kb folder:", error);
      toast.error("フォルダの削除に失敗しました");
    }
  };

  const moveToFolder = async (kbId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from("knowledge_bases")
        .update({ folder_id: folderId })
        .eq("id", kbId);

      if (error) throw error;
      toast.success(folderId ? "フォルダに移動しました" : "フォルダから外しました");
    } catch (error) {
      console.error("Failed to move kb to folder:", error);
      toast.error("移動に失敗しました");
    }
  };

  return {
    folders,
    isLoading,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveToFolder,
  };
}
