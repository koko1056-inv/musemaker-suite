import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type OutboundCall = Tables<'outbound_calls'>;

// Extended type that includes conversation data
export interface OutboundCallWithConversation extends OutboundCall {
  conversation?: {
    id: string;
    transcript: Array<{ role: 'agent' | 'user'; text: string }>;
    summary: string | null;
    key_points: string[] | null;
    audio_url: string | null;
    outcome: string | null;
    metadata: Record<string, unknown> | null;
    extracted_data?: Array<{ field_key: string; field_value: string | null }>;
  } | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useOutboundCalls(agentId?: string) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [isInitiating, setIsInitiating] = useState(false);

  const { data: outboundCalls = [], isLoading } = useQuery({
    queryKey: ['outbound-calls', workspace?.id, agentId],
    queryFn: async () => {
      if (!workspace?.id) return [];

      let query = supabase
        .from('outbound_calls')
        .select(`
          *,
          conversation:conversations(
            id,
            transcript,
            summary,
            key_points,
            audio_url,
            outcome,
            metadata,
            extracted_data:conversation_extracted_data(field_key, field_value)
          )
        `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching outbound calls:', error);
        throw error;
      }

      return data as OutboundCallWithConversation[];
    },
    enabled: !!workspace?.id,
    refetchInterval: 5000, // Poll every 5 seconds to get updated conversation data
  });

  const initiateCall = useCallback(async (params: {
    agentId: string;
    toNumber: string;
    scheduledAt?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!workspace?.id) {
      toast.error('ワークスペースが見つかりません');
      return null;
    }

    setIsInitiating(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/twilio-outbound-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          agentId: params.agentId,
          toNumber: params.toNumber,
          scheduledAt: params.scheduledAt,
          metadata: params.metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '発信に失敗しました');
      }

      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });

      if (params.scheduledAt) {
        toast.success('コールをスケジュールしました');
      } else {
        toast.success('発信を開始しました');
      }

      return data;
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error(error instanceof Error ? error.message : '発信に失敗しました');
      return null;
    } finally {
      setIsInitiating(false);
    }
  }, [workspace?.id, queryClient]);

  const cancelCall = useMutation({
    mutationFn: async (callId: string) => {
      const { error } = await supabase
        .from('outbound_calls')
        .update({ status: 'canceled' })
        .eq('id', callId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });
      toast.success('コールをキャンセルしました');
    },
    onError: (error) => {
      console.error('Error canceling call:', error);
      toast.error('キャンセルに失敗しました');
    },
  });

  const markAsRead = useCallback(async (callId: string) => {
    try {
      const { error } = await supabase
        .from('outbound_calls')
        .update({ is_read: true })
        .eq('id', callId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });
    } catch (error) {
      console.error('Error marking call as read:', error);
    }
  }, [queryClient]);

  const markAllAsRead = useCallback(async (agentId?: string) => {
    try {
      let query = supabase
        .from('outbound_calls')
        .update({ is_read: true })
        .eq('is_read', false);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { error } = await query;
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['outbound-calls'] });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [queryClient]);

  const unreadCount = outboundCalls.filter(c => !c.is_read).length;

  return {
    outboundCalls,
    isLoading,
    isInitiating,
    initiateCall,
    cancelCall: cancelCall.mutate,
    markAsRead,
    markAllAsRead,
    unreadCount,
  };
}
