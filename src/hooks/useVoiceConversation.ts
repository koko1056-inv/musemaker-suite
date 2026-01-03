import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranscriptMessage {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
}

interface VoiceConversationOptions {
  agentId: string;
  elevenLabsAgentId: string;
  phoneNumber?: string;
  onConversationEnd?: (conversationId: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useVoiceConversation(options: VoiceConversationOptions) {
  const { agentId, elevenLabsAgentId, phoneNumber, onConversationEnd } = options;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      startTimeRef.current = Date.now();
      toast.success('通話が開始されました');
    },
    onDisconnect: async () => {
      console.log('Disconnected from ElevenLabs agent');
      
      // Calculate duration
      const durationSeconds = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      // Save conversation to database
      if (transcriptRef.current.length > 0 || durationSeconds > 0) {
        await saveConversation(durationSeconds);
      }
    },
    onMessage: (message: any) => {
      console.log('Message received:', message);
      
      // Handle user transcript
      if (message.type === 'user_transcript') {
        const userMessage: TranscriptMessage = {
          role: 'user',
          text: message.user_transcription_event?.user_transcript || '',
          timestamp: Date.now(),
        };
        transcriptRef.current = [...transcriptRef.current, userMessage];
        setTranscript([...transcriptRef.current]);
      }
      
      // Handle agent response
      if (message.type === 'agent_response') {
        const agentMessage: TranscriptMessage = {
          role: 'agent',
          text: message.agent_response_event?.agent_response || '',
          timestamp: Date.now(),
        };
        transcriptRef.current = [...transcriptRef.current, agentMessage];
        setTranscript([...transcriptRef.current]);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast.error('通話エラーが発生しました');
    },
  });

  const saveConversation = useCallback(async (durationSeconds: number) => {
    setIsSaving(true);
    try {
      // Format transcript for database
      const formattedTranscript = transcriptRef.current.map(msg => ({
        role: msg.role,
        text: msg.text,
      }));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          phoneNumber: phoneNumber || null,
          transcript: formattedTranscript,
          durationSeconds,
          outcome: formattedTranscript.length > 0 ? '完了' : 'キャンセル',
          status: 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      const savedConversation = await response.json();
      console.log('Conversation saved:', savedConversation);
      toast.success('会話履歴を保存しました');
      
      onConversationEnd?.(savedConversation.id);
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('会話履歴の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [agentId, phoneNumber, onConversationEnd]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    transcriptRef.current = [];
    setTranscript([]);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get conversation token from edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: elevenLabsAgentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get conversation token');
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received');
      }

      // Start conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error(error instanceof Error ? error.message : '通話の開始に失敗しました');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, elevenLabsAgentId]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return {
    isConnecting,
    isSaving,
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    transcript,
    startConversation,
    endConversation,
  };
}
