import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Webhook {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  event_type: string;
  is_active: boolean;
  headers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  conversation_id: string | null;
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  sent_at: string;
}

export function useWebhooks(workspaceId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const webhooksQuery = useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Webhook[];
    },
    enabled: !!workspaceId,
  });

  const createWebhook = useMutation({
    mutationFn: async (webhook: { name: string; url: string; headers?: Record<string, string> }) => {
      if (!workspaceId) throw new Error("Workspace ID required");
      
      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          workspace_id: workspaceId,
          name: webhook.name,
          url: webhook.url,
          headers: webhook.headers || {},
          event_type: "conversation_ended",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
      toast({ title: "Webhookを作成しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const updateWebhook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Webhook> & { id: string }) => {
      const { data, error } = await supabase
        .from("webhooks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
      toast({ title: "Webhookを更新しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
      toast({ title: "Webhookを削除しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("webhooks")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
    },
  });

  return {
    webhooks: webhooksQuery.data || [],
    isLoading: webhooksQuery.isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
  };
}

export function useWebhookLogs(webhookId: string | undefined) {
  return useQuery({
    queryKey: ["webhook-logs", webhookId],
    queryFn: async () => {
      if (!webhookId) return [];
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .eq("webhook_id", webhookId)
        .order("sent_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!webhookId,
  });
}
