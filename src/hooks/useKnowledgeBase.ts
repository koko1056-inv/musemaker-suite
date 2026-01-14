import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEMO_WORKSPACE_ID, ensureDemoWorkspaceMembership } from "@/lib/workspace";

export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  folder_id: string | null;
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
  elevenlabs_document_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Helper function to sync knowledge item with ElevenLabs
async function syncKnowledgeItemToElevenLabs(
  action: 'create' | 'update' | 'delete',
  knowledgeItem?: { id: string; title: string; content: string },
  documentId?: string | null
): Promise<{ document_id?: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('elevenlabs-knowledge-sync', {
      body: { 
        action, 
        knowledgeItem,
        documentId 
      }
    });

    if (error) {
      console.error('ElevenLabs sync error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to sync with ElevenLabs:', err);
    return null;
  }
}

export function useKnowledgeBases() {
  return useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: async () => {
      await ensureDemoWorkspaceMembership();

      const { data, error } = await supabase
        .from("knowledge_bases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeBase[];
    },
  });
}

export function useAllKnowledgeItems() {
  return useQuery({
    queryKey: ["all-knowledge-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Group items by knowledge_base_id
      const grouped: Record<string, KnowledgeItem[]> = {};
      (data as KnowledgeItem[]).forEach(item => {
        if (!grouped[item.knowledge_base_id]) {
          grouped[item.knowledge_base_id] = [];
        }
        grouped[item.knowledge_base_id].push(item);
      });
      
      return grouped;
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
      await ensureDemoWorkspaceMembership();

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
      // First, get all knowledge items to delete from ElevenLabs
      const { data: items } = await supabase
        .from("knowledge_items")
        .select("id, elevenlabs_document_id")
        .eq("knowledge_base_id", id);

      // Delete each item from ElevenLabs
      if (items) {
        for (const item of items) {
          if (item.elevenlabs_document_id) {
            await syncKnowledgeItemToElevenLabs('delete', undefined, item.elevenlabs_document_id);
          }
        }
      }

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
      syncToElevenLabs?: boolean;
    }) => {
      const { syncToElevenLabs = true, ...insertData } = data;
      
      // First create in Supabase
      const { data: result, error } = await supabase
        .from("knowledge_items")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Sync to ElevenLabs if enabled (await to ensure completion)
      if (syncToElevenLabs) {
        const response = await syncKnowledgeItemToElevenLabs('create', {
          id: result.id,
          title: result.title,
          content: result.content,
        });
        if (response?.document_id) {
          console.log('Synced to ElevenLabs with document ID:', response.document_id);
        }
      }

      return { ...result, syncToElevenLabs };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-items", variables.knowledge_base_id] });
      queryClient.invalidateQueries({ queryKey: ["all-knowledge-items"] });
      if (result.syncToElevenLabs) {
        toast.success("ナレッジアイテムを追加し、ElevenLabsに同期しました");
      } else {
        toast.success("ナレッジアイテムを追加しました");
      }
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
      elevenlabs_document_id?: string | null;
      syncToElevenLabs?: boolean;
    }) => {
      const { id, knowledge_base_id, elevenlabs_document_id, syncToElevenLabs = true, ...updateData } = data;
      
      const { error } = await supabase
        .from("knowledge_items")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Sync to ElevenLabs if enabled (await to ensure completion)
      if (syncToElevenLabs) {
        const response = await syncKnowledgeItemToElevenLabs('update', {
          id: id,
          title: data.title,
          content: data.content,
        }, elevenlabs_document_id);
        if (response?.document_id) {
          console.log('Updated in ElevenLabs with new document ID:', response.document_id);
        }
      }

      return { id, knowledge_base_id, syncToElevenLabs };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-items", result.knowledge_base_id] });
      queryClient.invalidateQueries({ queryKey: ["all-knowledge-items"] });
      if (result.syncToElevenLabs) {
        toast.success("ナレッジアイテムを更新し、ElevenLabsに同期しました");
      } else {
        toast.success("ナレッジアイテムを更新しました");
      }
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
    mutationFn: async (data: { id: string; knowledge_base_id: string; elevenlabs_document_id?: string | null }) => {
      // Delete from ElevenLabs first
      if (data.elevenlabs_document_id) {
        await syncKnowledgeItemToElevenLabs('delete', undefined, data.elevenlabs_document_id);
      }

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

// Hook to sync agent's knowledge base with ElevenLabs
export function useSyncAgentKnowledge() {
  return useMutation({
    mutationFn: async (data: {
      agentId: string;
      elevenlabsAgentId: string;
      documentIds: { id: string; name: string; type?: string }[];
    }) => {
      const { data: result, error } = await supabase.functions.invoke('elevenlabs-knowledge-sync', {
        body: { 
          action: 'sync_agent',
          agentId: data.agentId,
          elevenlabsAgentId: data.elevenlabsAgentId,
          documentIds: data.documentIds,
        }
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("エージェントのナレッジベースを同期しました");
    },
    onError: (error) => {
      toast.error("ナレッジベースの同期に失敗しました");
      console.error(error);
    },
  });
}
