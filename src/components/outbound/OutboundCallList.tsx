import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
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
} from 'lucide-react';
import { useOutboundCalls } from '@/hooks/useOutboundCalls';
import { useAgents } from '@/hooks/useAgents';

interface OutboundCallListProps {
  agentId?: string;
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
          className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
        >
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
      ))}
    </div>
  );
}
