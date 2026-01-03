import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranscriptMessage {
  role: 'agent' | 'user';
  text: string;
}

interface Conversation {
  id: string;
  agent_id: string;
  phone_number: string | null;
  status: 'in_progress' | 'completed' | 'failed';
  duration_seconds: number | null;
  transcript: TranscriptMessage[];
  outcome: string | null;
  started_at: string;
  ended_at: string | null;
  agent?: {
    name: string;
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          agent:agents(name)
        `)
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map((conv) => ({
        ...conv,
        transcript: Array.isArray(conv.transcript) 
          ? (conv.transcript as unknown as TranscriptMessage[])
          : [],
      }));

      setConversations(transformedData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('会話履歴の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    refetch: fetchConversations,
  };
}
