import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpreadsheetIntegration {
  id: string;
  workspace_id: string;
  name: string;
  spreadsheet_id: string | null;
  sheet_name: string | null;
  is_active: boolean;
  is_authorized: boolean;
  google_access_token: string | null;
  google_refresh_token: string | null;
  token_expires_at: string | null;
  export_on_call_end: boolean;
  export_on_call_failed: boolean;
  include_transcript: boolean;
  include_summary: boolean;
  include_extracted_data: boolean;
  agent_ids: string[] | null;
  column_mapping: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateSpreadsheetIntegrationInput {
  name: string;
  spreadsheet_id?: string;
  sheet_name?: string;
  export_on_call_end?: boolean;
  export_on_call_failed?: boolean;
  include_transcript?: boolean;
  include_summary?: boolean;
  include_extracted_data?: boolean;
  agent_ids?: string[] | null;
}

export function useSpreadsheetIntegrations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['spreadsheet-integrations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('spreadsheet_integrations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SpreadsheetIntegration[];
    },
    enabled: !!workspaceId,
    staleTime: 60000,
  });

  const createIntegration = useMutation({
    mutationFn: async (input: CreateSpreadsheetIntegrationInput) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('spreadsheet_integrations')
        .insert({
          workspace_id: workspaceId,
          name: input.name,
          spreadsheet_id: input.spreadsheet_id || null,
          sheet_name: input.sheet_name || 'Sheet1',
          export_on_call_end: input.export_on_call_end ?? true,
          export_on_call_failed: input.export_on_call_failed ?? false,
          include_transcript: input.include_transcript ?? false,
          include_summary: input.include_summary ?? true,
          include_extracted_data: input.include_extracted_data ?? true,
          agent_ids: input.agent_ids ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SpreadsheetIntegration;
    },
    onSuccess: (newIntegration) => {
      queryClient.setQueryData<SpreadsheetIntegration[]>(
        ['spreadsheet-integrations', workspaceId],
        (old) => [newIntegration, ...(old || [])]
      );
      toast.success('スプレッドシート連携を作成しました');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'スプレッドシート連携の作成に失敗しました');
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SpreadsheetIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from('spreadsheet_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SpreadsheetIntegration;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['spreadsheet-integrations', workspaceId] });
      const previousData = queryClient.getQueryData<SpreadsheetIntegration[]>(['spreadsheet-integrations', workspaceId]);
      
      queryClient.setQueryData<SpreadsheetIntegration[]>(
        ['spreadsheet-integrations', workspaceId],
        (old) => old?.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('スプレッドシート連携を更新しました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['spreadsheet-integrations', workspaceId], context.previousData);
      }
      toast.error(error.message || 'スプレッドシート連携の更新に失敗しました');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['spreadsheet-integrations', workspaceId] });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spreadsheet_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['spreadsheet-integrations', workspaceId] });
      const previousData = queryClient.getQueryData<SpreadsheetIntegration[]>(['spreadsheet-integrations', workspaceId]);
      
      queryClient.setQueryData<SpreadsheetIntegration[]>(
        ['spreadsheet-integrations', workspaceId],
        (old) => old?.filter((item) => item.id !== id)
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('スプレッドシート連携を削除しました');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['spreadsheet-integrations', workspaceId], context.previousData);
      }
      toast.error(error.message || 'スプレッドシート連携の削除に失敗しました');
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('spreadsheet_integrations')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      return { id, is_active };
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['spreadsheet-integrations', workspaceId] });
      const previousData = queryClient.getQueryData<SpreadsheetIntegration[]>(['spreadsheet-integrations', workspaceId]);
      
      queryClient.setQueryData<SpreadsheetIntegration[]>(
        ['spreadsheet-integrations', workspaceId],
        (old) => old?.map((item) => (item.id === id ? { ...item, is_active } : item))
      );
      
      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['spreadsheet-integrations', workspaceId], context.previousData);
      }
    },
  });

  const startOAuthFlow = useCallback(async (integrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-oauth', {
        body: { action: 'get_auth_url', integration_id: integrationId },
      });

      if (error) throw error;
      
      if (data?.auth_url) {
        window.open(data.auth_url, '_blank', 'width=500,height=600');
        return true;
      }
      return false;
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error('Google認証の開始に失敗しました');
      return false;
    }
  }, []);

  const listSpreadsheets = useCallback(async (integrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-oauth', {
        body: { action: 'list_spreadsheets', integration_id: integrationId },
      });

      if (error) throw error;
      return data?.spreadsheets || [];
    } catch (error) {
      console.error('List spreadsheets error:', error);
      toast.error('スプレッドシート一覧の取得に失敗しました');
      return [];
    }
  }, []);

  const listSheets = useCallback(async (integrationId: string, spreadsheetId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-oauth', {
        body: { action: 'list_sheets', integration_id: integrationId, spreadsheet_id: spreadsheetId },
      });

      if (error) throw error;
      return data?.sheets || [];
    } catch (error) {
      console.error('List sheets error:', error);
      toast.error('シート一覧の取得に失敗しました');
      return [];
    }
  }, []);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['spreadsheet-integrations', workspaceId] });
  }, [queryClient, workspaceId]);

  return {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    startOAuthFlow,
    listSpreadsheets,
    listSheets,
    refetch,
  };
}
