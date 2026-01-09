import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
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
  
  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      startTimeRef.current = Date.now();
      toast.success('通話が開始されました');
    },
    onDisconnect: async () => {
      console.log('Disconnected from ElevenLabs agent');
      
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Calculate duration
      const durationSeconds = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      // Wait a bit for the last audio chunk
      await new Promise(resolve => setTimeout(resolve, 100));

      // Save conversation to database
      if (transcriptRef.current.length > 0 || durationSeconds > 0) {
        await saveConversation(durationSeconds);
      }
    },
    onMessage: (message: any) => {
      console.log('Message received:', message);
      
      // Handle user transcript - different possible message formats
      if (message.type === 'user_transcript' || message.user_transcript) {
        const userText = message.user_transcription_event?.user_transcript || 
                        message.user_transcript ||
                        message.text ||
                        '';
        if (userText) {
          const userMessage: TranscriptMessage = {
            role: 'user',
            text: userText,
            timestamp: Date.now(),
          };
          transcriptRef.current = [...transcriptRef.current, userMessage];
          setTranscript([...transcriptRef.current]);
        }
      }
      
      // Handle agent response - different possible message formats
      if (message.type === 'agent_response' || message.agent_response) {
        const agentText = message.agent_response_event?.agent_response ||
                         message.agent_response ||
                         message.text ||
                         '';
        if (agentText) {
          const agentMessage: TranscriptMessage = {
            role: 'agent',
            text: agentText,
            timestamp: Date.now(),
          };
          transcriptRef.current = [...transcriptRef.current, agentMessage];
          setTranscript([...transcriptRef.current]);
        }
      }

      // Handle transcript message with role field
      if (message.role && message.message) {
        const transcriptMessage: TranscriptMessage = {
          role: message.role === 'user' ? 'user' : 'agent',
          text: message.message,
          timestamp: Date.now(),
        };
        transcriptRef.current = [...transcriptRef.current, transcriptMessage];
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

      // Create audio blob from chunks
      const audioBlob = audioChunksRef.current.length > 0 
        ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
        : null;

      // Create form data
      const formData = new FormData();
      formData.append('agentId', agentId);
      formData.append('transcript', JSON.stringify(formattedTranscript));
      formData.append('durationSeconds', durationSeconds.toString());
      formData.append('outcome', formattedTranscript.length > 0 ? '完了' : 'キャンセル');
      formData.append('status', 'completed');
      
      if (phoneNumber) {
        formData.append('phoneNumber', phoneNumber);
      }
      
      if (audioBlob && audioBlob.size > 0) {
        formData.append('audio', audioBlob, 'recording.webm');
        console.log(`Audio recording size: ${audioBlob.size} bytes`);
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-conversation`, {
        method: 'POST',
        body: formData,
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
      audioChunksRef.current = [];
    }
  }, [agentId, phoneNumber, onConversationEnd]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    transcriptRef.current = [];
    audioChunksRef.current = [];
    setTranscript([]);
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      console.log('Audio recording started');

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
      
      // Cleanup on error
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
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
    conversation, // Expose conversation for audio level monitoring
  };
}
