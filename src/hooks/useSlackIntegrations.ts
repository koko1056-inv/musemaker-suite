import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SlackIntegration {
  id: string;
  workspace_id: string;
  name: string;
  webhook_url: string;
  channel_name: string | null;
  is_active: boolean;
  notify_on_call_start: boolean;
  notify_on_call_end: boolean;
  notify_on_call_failed: boolean;
  include_transcript: boolean;
  include_summary: boolean;
  message_template: string | null;
  agent_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSlackIntegrationInput {
  name: string;
  webhook_url: string;
  channel_name?: string;
  notify_on_call_start?: boolean;
  notify_on_call_end?: boolean;
  notify_on_call_failed?: boolean;
  include_transcript?: boolean;
  include_summary?: boolean;
  agent_ids?: string[] | null;
}

export function useSlackIntegrations(workspaceId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const slackIntegrationsQuery = useQuery({
    queryKey: ["slack-integrations", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("slack_integrations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SlackIntegration[];
    },
    enabled: !!workspaceId,
  });

  const createIntegration = useMutation({
    mutationFn: async (input: CreateSlackIntegrationInput) => {
      if (!workspaceId) throw new Error("Workspace ID required");

      const { data, error } = await supabase
        .from("slack_integrations")
        .insert({
          workspace_id: workspaceId,
          name: input.name,
          webhook_url: input.webhook_url,
          channel_name: input.channel_name || null,
          notify_on_call_start: input.notify_on_call_start ?? false,
          notify_on_call_end: input.notify_on_call_end ?? true,
          notify_on_call_failed: input.notify_on_call_failed ?? true,
          include_transcript: input.include_transcript ?? false,
          include_summary: input.include_summary ?? true,
          agent_ids: input.agent_ids ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-integrations", workspaceId] });
      toast({ title: "Slack連携を作成しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SlackIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from("slack_integrations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-integrations", workspaceId] });
      toast({ title: "Slack連携を更新しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("slack_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-integrations", workspaceId] });
      toast({ title: "Slack連携を削除しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("slack_integrations")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-integrations", workspaceId] });
    },
  });

  const testWebhook = async (webhookUrl: string) => {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🎉 Musa AI からのテスト通知です！連携が正常に設定されました。",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*🎉 テスト通知*\nMusa AI との連携が正常に設定されました！",
              },
            },
          ],
        }),
      });
      toast({ title: "テスト通知を送信しました", description: "Slackを確認してください" });
      return true;
    } catch (error) {
      toast({ title: "送信エラー", description: "Webhook URLを確認してください", variant: "destructive" });
      return false;
    }
  };

  return {
    integrations: slackIntegrationsQuery.data || [],
    isLoading: slackIntegrationsQuery.isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    testWebhook,
  };
}
