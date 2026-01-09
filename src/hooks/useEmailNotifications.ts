import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailNotification {
  id: string;
  workspace_id: string;
  name: string;
  recipient_email: string;
  is_active: boolean;
  notify_on_call_start: boolean;
  notify_on_call_end: boolean;
  notify_on_call_failed: boolean;
  include_summary: boolean;
  include_transcript: boolean;
  message_template: string | null;
  agent_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailNotificationInput {
  name: string;
  recipient_email: string;
  notify_on_call_start?: boolean;
  notify_on_call_end?: boolean;
  notify_on_call_failed?: boolean;
  include_summary?: boolean;
  include_transcript?: boolean;
  agent_ids?: string[] | null;
}

export interface UpdateEmailNotificationInput {
  id: string;
  name?: string;
  recipient_email?: string;
  notify_on_call_start?: boolean;
  notify_on_call_end?: boolean;
  notify_on_call_failed?: boolean;
  include_summary?: boolean;
  include_transcript?: boolean;
  message_template?: string | null;
  agent_ids?: string[] | null;
}

export function useEmailNotifications(workspaceId: string) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['email-notifications', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailNotification[];
    },
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
  });

  const createNotification = useMutation({
    mutationFn: async (input: CreateEmailNotificationInput) => {
      const { data, error } = await supabase
        .from('email_notifications')
        .insert({
          workspace_id: workspaceId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailNotification;
    },
    onSuccess: (newNotification) => {
      queryClient.setQueryData<EmailNotification[]>(
        ['email-notifications', workspaceId],
        (old) => [newNotification, ...(old || [])]
      );
      toast.success('メール通知を作成しました', {
        description: '通話イベントでメール通知が送信されます',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'メール通知の作成に失敗しました');
    },
  });

  const updateNotification = useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmailNotificationInput) => {
      const { data, error } = await supabase
        .from('email_notifications')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailNotification;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['email-notifications', workspaceId] });
      const previousData = queryClient.getQueryData<EmailNotification[]>(['email-notifications', workspaceId]);
      
      queryClient.setQueryData<EmailNotification[]>(
        ['email-notifications', workspaceId],
        (old) => old?.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('設定を更新しました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['email-notifications', workspaceId], context.previousData);
      }
      toast.error(error.message || '設定の更新に失敗しました');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['email-notifications', workspaceId] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['email-notifications', workspaceId] });
      const previousData = queryClient.getQueryData<EmailNotification[]>(['email-notifications', workspaceId]);
      
      queryClient.setQueryData<EmailNotification[]>(
        ['email-notifications', workspaceId],
        (old) => old?.filter((item) => item.id !== id)
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('メール通知を削除しました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['email-notifications', workspaceId], context.previousData);
      }
      toast.error(error.message || 'メール通知の削除に失敗しました');
    },
  });

  const toggleNotification = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('email_notifications')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailNotification;
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['email-notifications', workspaceId] });
      const previousData = queryClient.getQueryData<EmailNotification[]>(['email-notifications', workspaceId]);
      
      queryClient.setQueryData<EmailNotification[]>(
        ['email-notifications', workspaceId],
        (old) => old?.map((item) => (item.id === id ? { ...item, is_active } : item))
      );
      
      return { previousData };
    },
    onSuccess: (data) => {
      toast.success(data.is_active ? '通知を有効にしました' : '通知を無効にしました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['email-notifications', workspaceId], context.previousData);
      }
      toast.error(error.message || '通知の切り替えに失敗しました');
    },
  });

  const testEmail = useCallback(async (recipientEmail: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          workspace_id: workspaceId,
          event_type: 'call_end',
          agent_name: 'テストエージェント',
          phone_number: '+81 90-1234-5678',
          duration_seconds: 125,
          summary: 'これはテスト通知です。メール通知が正しく設定されていることを確認するためのテストメールです。',
          outcome: 'テスト成功',
        },
      });

      if (error) throw error;

      toast.success('テストメールを送信しました', {
        description: `${recipientEmail} に送信されました`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'テストメールの送信に失敗しました';
      toast.error(message);
    }
  }, [workspaceId]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['email-notifications', workspaceId] });
  }, [queryClient, workspaceId]);

  return {
    notifications,
    isLoading,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleNotification,
    testEmail,
    refetch,
  };
}
