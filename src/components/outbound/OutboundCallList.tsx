import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  PhoneOff,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  X,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { useOutboundCalls } from '@/hooks/useOutboundCalls';
import { Slider } from '@/components/ui/slider';
import { useAgents } from '@/hooks/useAgents';

interface OutboundCallListProps {
  agentId?: string;
}

// Mini audio player component
function MiniAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 min-w-[200px]" onClick={e => e.stopPropagation()}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" />
        )}
      </Button>
      <div className="flex-1 flex items-center gap-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
          {formatTime(currentTime)}
        </span>
      </div>
      <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </div>
  );
}

export function OutboundCallList({ agentId }: OutboundCallListProps) {
  const { outboundCalls, isLoading, cancelCall } = useOutboundCalls(agentId);
  const { agents } = useAgents();

  const getAgentName = (id: string) => {
    const agent = agents.find(a => a.id === id);
    return agent?.name || '不明';
  };

  const getStatusBadge = (status: string, result?: string | null) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="secondary" className="gap-1 font-normal">
            <Calendar className="h-3 w-3" />
            予約済み
          </Badge>
        );
      case 'initiating':
      case 'ringing':
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Loader2 className="h-3 w-3 animate-spin" />
            発信中
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 border-green-500/20">
            <Phone className="h-3 w-3" />
            通話中
          </Badge>
        );
      case 'completed':
        if (result === 'answered') {
          return (
            <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="h-3 w-3" />
              完了
            </Badge>
          );
        } else if (result === 'busy') {
          return (
            <Badge variant="secondary" className="gap-1 font-normal bg-amber-500/10 text-amber-600 border-amber-500/20">
              <PhoneOff className="h-3 w-3" />
              話し中
            </Badge>
          );
        } else if (result === 'no_answer') {
          return (
            <Badge variant="secondary" className="gap-1 font-normal bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Clock className="h-3 w-3" />
              応答なし
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="gap-1 font-normal">
            <CheckCircle2 className="h-3 w-3" />
            完了
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1 font-normal">
            <XCircle className="h-3 w-3" />
            失敗
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="secondary" className="gap-1 font-normal">
            <X className="h-3 w-3" />
            キャンセル
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="font-normal">{status}</Badge>;
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (outboundCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-5">
          <Phone className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">発信履歴がありません</h3>
        <p className="text-sm text-muted-foreground">
          発信すると、ここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {outboundCalls.map((call) => (
        <div
          key={call.id}
          className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-sm">{call.to_number}</span>
                {getStatusBadge(call.status, call.result)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {!agentId && (
                  <span>{getAgentName(call.agent_id)}</span>
                )}
                <span>
                  {call.scheduled_at
                    ? format(new Date(call.scheduled_at), 'M/d HH:mm', { locale: ja })
                    : format(new Date(call.created_at), 'M/d HH:mm', { locale: ja })}
                </span>
                {call.duration_seconds && (
                  <span>{formatDuration(call.duration_seconds)}</span>
                )}
              </div>
            </div>
            
            {(call.status === 'scheduled' || call.status === 'initiating') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelCall(call.id)}
                className="rounded-xl text-muted-foreground hover:text-destructive"
              >
                キャンセル
              </Button>
            )}
          </div>

          {/* Audio Player */}
          {call.conversation?.audio_url && (
            <MiniAudioPlayer audioUrl={call.conversation.audio_url} />
          )}
        </div>
      ))}
    </div>
  );
}
