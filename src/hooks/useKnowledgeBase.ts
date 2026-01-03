import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  knowledge_base_id: string;
  title: string;
  content: string;
  category: string | null;
  file_url: string | null;
  file_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export function useKnowledgeBases() {
  return useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_bases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeBase[];
    },
  });
}

export function useKnowledgeItems(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: ["knowledge-items", knowledgeBaseId],
    queryFn: async () => {
      if (!knowledgeBaseId) return [];
      
      const { data, error } = await supabase
        .from("knowledge_items")
        .select("*")
        .eq("knowledge_base_id", knowledgeBaseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeItem[];
    },
    enabled: !!knowledgeBaseId,
  });
}

export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from("knowledge_bases")
        .insert({
          name: data.name,
          description: data.description,
          workspace_id: DEMO_WORKSPACE_ID,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      toast.success("ナレッジベースを作成しました");
    },
    onError: (error) => {
      toast.error("ナレッジベースの作成に失敗しました");
      console.error(error);
    },
  });
}

export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_bases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      toast.success("ナレッジベースを削除しました");
    },
    onError: (error) => {
      toast.error("ナレッジベースの削除に失敗しました");
      console.error(error);
    },
  });
}

export function useCreateKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      knowledge_base_id: string;
      title: string;
      content: string;
      category?: string;
      file_url?: string;
      file_type?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("knowledge_items")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-items", variables.knowledge_base_id] });
      toast.success("ナレッジアイテムを追加しました");
    },
    onError: (error) => {
      toast.error("ナレッジアイテムの追加に失敗しました");
      console.error(error);
    },
  });
}

export function useUpdateKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      knowledge_base_id: string;
      title: string;
      content: string;
      category?: string;
    }) => {
      const { id, knowledge_base_id, ...updateData } = data;
      const { error } = await supabase
        .from("knowledge_items")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return { id, knowledge_base_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-items", result.knowledge_base_id] });
      toast.success("ナレッジアイテムを更新しました");
    },
    onError: (error) => {
      toast.error("ナレッジアイテムの更新に失敗しました");
      console.error(error);
    },
  });
}

export function useDeleteKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; knowledge_base_id: string }) => {
      const { error } = await supabase
        .from("knowledge_items")
        .delete()
        .eq("id", data.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-items", result.knowledge_base_id] });
      toast.success("ナレッジアイテムを削除しました");
    },
    onError: (error) => {
      toast.error("ナレッジアイテムの削除に失敗しました");
      console.error(error);
    },
  });
}

export function useUploadKnowledgeFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("knowledge-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("knowledge-files")
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        type: file.type,
        name: file.name,
      };
    },
    onError: (error) => {
      toast.error("ファイルのアップロードに失敗しました");
      console.error(error);
    },
  });
}
