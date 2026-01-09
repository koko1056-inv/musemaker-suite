import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['slack-integrations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('slack_integrations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SlackIntegration[];
    },
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
  });

  const createIntegration = useMutation({
    mutationFn: async (input: CreateSlackIntegrationInput) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('slack_integrations')
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
      return data as SlackIntegration;
    },
    onSuccess: (newIntegration) => {
      queryClient.setQueryData<SlackIntegration[]>(
        ['slack-integrations', workspaceId],
        (old) => [newIntegration, ...(old || [])]
      );
      toast.success('Slack連携を作成しました');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Slack連携の作成に失敗しました');
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SlackIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from('slack_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SlackIntegration;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['slack-integrations', workspaceId] });
      const previousData = queryClient.getQueryData<SlackIntegration[]>(['slack-integrations', workspaceId]);
      
      queryClient.setQueryData<SlackIntegration[]>(
        ['slack-integrations', workspaceId],
        (old) => old?.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Slack連携を更新しました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['slack-integrations', workspaceId], context.previousData);
      }
      toast.error(error.message || 'Slack連携の更新に失敗しました');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['slack-integrations', workspaceId] });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('slack_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['slack-integrations', workspaceId] });
      const previousData = queryClient.getQueryData<SlackIntegration[]>(['slack-integrations', workspaceId]);
      
      queryClient.setQueryData<SlackIntegration[]>(
        ['slack-integrations', workspaceId],
        (old) => old?.filter((item) => item.id !== id)
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Slack連携を削除しました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['slack-integrations', workspaceId], context.previousData);
      }
      toast.error(error.message || 'Slack連携の削除に失敗しました');
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('slack_integrations')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      return { id, is_active };
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['slack-integrations', workspaceId] });
      const previousData = queryClient.getQueryData<SlackIntegration[]>(['slack-integrations', workspaceId]);
      
      queryClient.setQueryData<SlackIntegration[]>(
        ['slack-integrations', workspaceId],
        (old) => old?.map((item) => (item.id === id ? { ...item, is_active } : item))
      );
      
      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['slack-integrations', workspaceId], context.previousData);
      }
    },
  });

  const testWebhook = useCallback(async (webhookUrl: string) => {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🎉 Musa AI からのテスト通知です！連携が正常に設定されました。',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*🎉 テスト通知*\nMusa AI との連携が正常に設定されました！',
              },
            },
          ],
        }),
      });
      toast.success('テスト通知を送信しました', { description: 'Slackを確認してください' });
      return true;
    } catch {
      toast.error('送信エラー', { description: 'Webhook URLを確認してください' });
      return false;
    }
  }, []);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['slack-integrations', workspaceId] });
  }, [queryClient, workspaceId]);

  return {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    testWebhook,
    refetch,
  };
}
