import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    return agent?.name || '不明なエージェント';
  };

  const getStatusBadge = (status: string, result?: string | null) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            スケジュール済み
          </Badge>
        );
      case 'initiating':
      case 'ringing':
        return (
          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50">
            <Loader2 className="h-3 w-3 animate-spin" />
            発信中
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
            <Phone className="h-3 w-3" />
            通話中
          </Badge>
        );
      case 'completed':
        if (result === 'answered') {
          return (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
              <CheckCircle2 className="h-3 w-3" />
              完了
            </Badge>
          );
        } else if (result === 'busy') {
          return (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
              <PhoneOff className="h-3 w-3" />
              話し中
            </Badge>
          );
        } else if (result === 'no_answer') {
          return (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
              <Clock className="h-3 w-3" />
              応答なし
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            完了
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            失敗
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="secondary" className="gap-1">
            <X className="h-3 w-3" />
            キャンセル
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (outboundCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Phone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">発信履歴がありません</h3>
        <p className="text-sm text-muted-foreground">
          アウトバウンドコールを開始すると、ここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>発信先</TableHead>
            {!agentId && <TableHead>エージェント</TableHead>}
            <TableHead>ステータス</TableHead>
            <TableHead>通話時間</TableHead>
            <TableHead>発信日時</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {outboundCalls.map((call) => (
            <TableRow key={call.id}>
              <TableCell className="font-mono">{call.to_number}</TableCell>
              {!agentId && (
                <TableCell>{getAgentName(call.agent_id)}</TableCell>
              )}
              <TableCell>{getStatusBadge(call.status, call.result)}</TableCell>
              <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
              <TableCell>
                {call.scheduled_at ? (
                  <div className="text-sm">
                    <div>{format(new Date(call.scheduled_at), 'yyyy/MM/dd', { locale: ja })}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(call.scheduled_at), 'HH:mm', { locale: ja })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <div>{format(new Date(call.created_at), 'yyyy/MM/dd', { locale: ja })}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(call.created_at), 'HH:mm', { locale: ja })}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {(call.status === 'scheduled' || call.status === 'initiating') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelCall(call.id)}
                  >
                    キャンセル
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
