import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["email-notifications", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_notifications")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmailNotification[];
    },
    enabled: !!workspaceId,
  });

  const createNotification = useMutation({
    mutationFn: async (input: CreateEmailNotificationInput) => {
      const { data, error } = await supabase
        .from("email_notifications")
        .insert({
          workspace_id: workspaceId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-notifications", workspaceId] });
      toast({
        title: "メール通知を作成しました",
        description: "通話イベントでメール通知が送信されます",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNotification = useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmailNotificationInput) => {
      const { data, error } = await supabase
        .from("email_notifications")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-notifications", workspaceId] });
      toast({
        title: "設定を更新しました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-notifications", workspaceId] });
      toast({
        title: "メール通知を削除しました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleNotification = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("email_notifications")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-notifications", workspaceId] });
      toast({
        title: data.is_active ? "通知を有効にしました" : "通知を無効にしました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testEmail = async (recipientEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-email-notification", {
        body: {
          workspace_id: workspaceId,
          event_type: "call_end",
          agent_name: "テストエージェント",
          phone_number: "+81 90-1234-5678",
          duration_seconds: 125,
          summary: "これはテスト通知です。メール通知が正しく設定されていることを確認するためのテストメールです。",
          outcome: "テスト成功",
        },
      });

      if (error) throw error;

      toast({
        title: "テストメールを送信しました",
        description: `${recipientEmail} に送信されました`,
      });
    } catch (error: any) {
      toast({
        title: "テストメールの送信に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    notifications,
    isLoading,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleNotification,
    testEmail,
  };
}
