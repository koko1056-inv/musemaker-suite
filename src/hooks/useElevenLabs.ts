import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface Voice {
  id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useElevenLabs() {
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchVoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-voices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('音声の取得に失敗しました');
      }

      const data = await response.json();
      setVoices(data.voices || []);
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('音声の取得に失敗しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSpeech = useCallback(async (text: string, voiceId: string) => {
    setIsLoading(true);
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '音声生成に失敗しました');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      toast.success('音声を再生中');
    } catch (error) {
      console.error('Error generating speech:', error);
      toast.error(error instanceof Error ? error.message : '音声生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return {
    isLoading,
    voices,
    fetchVoices,
    generateSpeech,
    stopAudio,
  };
}
