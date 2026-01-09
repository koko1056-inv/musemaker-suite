import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExtractionField {
  id: string;
  agent_id: string;
  field_name: string;
  field_key: string;
  field_type: string;
  description: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export function useAgentExtractionFields(agentId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["agent-extraction-fields", agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ExtractionField[];
    },
    enabled: !!agentId,
  });

  const createField = useMutation({
    mutationFn: async (field: {
      agent_id: string;
      field_name: string;
      field_key: string;
      field_type?: string;
      description?: string;
      is_required?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .insert(field)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-extraction-fields", agentId] });
      toast({ title: "抽出フィールドを追加しました" });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ExtractionField> & { id: string }) => {
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-extraction-fields", agentId] });
      toast({ title: "抽出フィールドを更新しました" });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agent_extraction_fields")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-extraction-fields", agentId] });
      toast({ title: "抽出フィールドを削除しました" });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    fields,
    isLoading,
    createField,
    updateField,
    deleteField,
  };
}

export function useConversationExtractedData(conversationId: string | undefined) {
  const { data: extractedData = [], isLoading } = useQuery({
    queryKey: ["conversation-extracted-data", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from("conversation_extracted_data")
        .select("*")
        .eq("conversation_id", conversationId);

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });

  return {
    extractedData,
    isLoading,
  };
}
