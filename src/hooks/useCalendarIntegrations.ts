import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

export interface CalendarIntegration {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  name: string;
  calendar_id: string | null;
  event_duration_minutes: number;
  create_on_call_end: boolean;
  create_on_call_failed: boolean;
  event_title_template: string;
  event_description_template: string;
  is_active: boolean;
  is_authorized: boolean;
  google_access_token: string | null;
  google_refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarIntegrationInput {
  workspace_id: string;
  agent_id?: string | null;
  name: string;
  calendar_id?: string | null;
  event_duration_minutes?: number;
  create_on_call_end?: boolean;
  create_on_call_failed?: boolean;
  event_title_template?: string;
  event_description_template?: string;
  is_active?: boolean;
}

export interface UpdateCalendarIntegrationInput {
  id: string;
  name?: string;
  calendar_id?: string | null;
  agent_id?: string | null;
  event_duration_minutes?: number;
  create_on_call_end?: boolean;
  create_on_call_failed?: boolean;
  event_title_template?: string;
  event_description_template?: string;
  is_active?: boolean;
}

export const useCalendarIntegrations = (workspaceId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading, refetch } = useQuery({
    queryKey: ["calendar-integrations", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from("calendar_integrations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CalendarIntegration[];
    },
    enabled: !!workspaceId,
  });

  const createIntegration = useMutation({
    mutationFn: async (input: CreateCalendarIntegrationInput) => {
      const { data, error } = await supabase
        .from("calendar_integrations")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations", workspaceId] });
      toast({
        title: "連携を作成しました",
        description: "Google Calendar連携が正常に作成されました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `連携の作成に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async (input: UpdateCalendarIntegrationInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("calendar_integrations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations", workspaceId] });
      toast({
        title: "連携を更新しました",
        description: "Google Calendar連携が正常に更新されました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `連携の更新に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations", workspaceId] });
      toast({
        title: "連携を削除しました",
        description: "Google Calendar連携が正常に削除されました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `連携の削除に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("calendar_integrations")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations", workspaceId] });
      toast({
        title: data.is_active ? "連携を有効化しました" : "連携を無効化しました",
        description: `「${data.name}」が${data.is_active ? "有効" : "無効"}になりました。`,
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `連携の切り替えに失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const startOAuthFlow = useCallback(async (integrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth", {
        body: { action: "get_auth_url", integration_id: integrationId },
      });

      if (error) throw error;
      if (data?.auth_url) {
        window.open(data.auth_url, "_blank", "width=500,height=600");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "エラー",
        description: `OAuth認証の開始に失敗しました: ${message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const listCalendars = useCallback(async (integrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth", {
        body: { action: "list_calendars", integration_id: integrationId },
      });

      if (error) throw error;
      return data?.calendars || [];
    } catch (error) {
      console.error("List calendars error:", error);
      toast({
        title: "エラー",
        description: "カレンダー一覧の取得に失敗しました",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const revokeAuthorization = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.functions.invoke("google-calendar-oauth", {
        body: { action: "revoke", integration_id: integrationId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations", workspaceId] });
      toast({
        title: "認証を解除しました",
        description: "Google Calendar連携の認証を解除しました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `認証解除に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    integrations: integrations || [],
    isLoading,
    refetch,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    startOAuthFlow,
    listCalendars,
    revokeAuthorization,
  };
};