import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgentKnowledgeBase {
  id: string;
  agent_id: string;
  knowledge_base_id: string;
  created_at: string;
  knowledge_base?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function useAgentKnowledgeBases(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-knowledge-bases", agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from("agent_knowledge_bases")
        .select(`
          id,
          agent_id,
          knowledge_base_id,
          created_at,
          knowledge_bases:knowledge_base_id (
            id,
            name,
            description
          )
        `)
        .eq("agent_id", agentId);

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        agent_id: item.agent_id,
        knowledge_base_id: item.knowledge_base_id,
        created_at: item.created_at,
        knowledge_base: item.knowledge_bases,
      })) as AgentKnowledgeBase[];
    },
    enabled: !!agentId,
  });
}

export function useLinkKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { agent_id: string; knowledge_base_id: string }) => {
      const { data: result, error } = await supabase
        .from("agent_knowledge_bases")
        .insert(data)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("このナレッジベースは既に紐付けられています");
        }
        throw error;
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent-knowledge-bases", variables.agent_id] });
      toast.success("ナレッジベースを紐付けました");
    },
    onError: (error: Error) => {
      toast.error(error.message || "ナレッジベースの紐付けに失敗しました");
    },
  });
}

export function useUnlinkKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; agent_id: string }) => {
      const { error } = await supabase
        .from("agent_knowledge_bases")
        .delete()
        .eq("id", data.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["agent-knowledge-bases", result.agent_id] });
      toast.success("ナレッジベースの紐付けを解除しました");
    },
    onError: () => {
      toast.error("ナレッジベースの紐付け解除に失敗しました");
    },
  });
}
