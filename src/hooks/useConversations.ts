import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ensureDemoWorkspaceMembership } from '@/lib/workspace';

interface TranscriptMessage {
  role: 'agent' | 'user';
  text: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  phone_number: string | null;
  status: 'in_progress' | 'completed' | 'failed';
  duration_seconds: number | null;
  transcript: TranscriptMessage[];
  outcome: string | null;
  started_at: string;
  ended_at: string | null;
  audio_url: string | null;
  summary: string | null;
  key_points: string[];
  is_read: boolean;
  metadata: {
    sentiment?: string;
    action_items?: string[];
    summarized_at?: string;
    call_type?: 'inbound' | 'outbound';
    extracted_data?: Record<string, string>;
  } | null;
  agent?: {
    name: string;
    icon_name?: string;
    icon_color?: string;
  };
  extracted_data?: Array<{
    field_key: string;
    field_value: string;
  }>;
}

export function useConversations() {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      await ensureDemoWorkspaceMembership();

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          agent:agents(name, icon_name, icon_color),
          extracted_data:conversation_extracted_data(field_key, field_value)
        `)
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform and filter out outbound calls
      return (data || [])
        .filter((conv) => {
          const callType = (conv.metadata as { call_type?: string } | null)?.call_type;
          return callType !== 'outbound';
        })
        .map((conv) => ({
          ...conv,
          transcript: Array.isArray(conv.transcript) 
            ? (conv.transcript as unknown as TranscriptMessage[])
            : [],
          key_points: Array.isArray(conv.key_points)
            ? (conv.key_points as unknown as string[])
            : [],
          metadata: conv.metadata as Conversation['metadata'],
        })) as Conversation[];
    },
    staleTime: 30000, // 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('conversations')
        .update({ is_read: true })
        .eq('id', conversationId);

      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old?.map((conv) =>
          conv.id === conversationId ? { ...conv, is_read: true } : conv
        )
      );
    },
    onError: (error) => {
      console.error('Error marking conversation as read:', error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (agentId?: string) => {
      let query = supabase
        .from('conversations')
        .update({ is_read: true })
        .eq('is_read', false);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { error } = await query;
      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old?.map((conv) =>
          (!agentId || conv.agent_id === agentId) ? { ...conv, is_read: true } : conv
        )
      );
    },
    onError: (error) => {
      console.error('Error marking all as read:', error);
    },
  });

  const markAsRead = useCallback(
    (conversationId: string) => markAsReadMutation.mutate(conversationId),
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(
    (agentId?: string) => markAllAsReadMutation.mutate(agentId),
    [markAllAsReadMutation]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient]);

  const unreadCount = useMemo(
    () => conversations.filter((c) => !c.is_read).length,
    [conversations]
  );

  return {
    conversations,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    unreadCount,
  };
}
