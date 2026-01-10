import React, { useState, useRef, useMemo, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ChevronDown,
  Share2,
  Copy,
  MessageSquare,
  Mail,
  User,
  PhoneOutgoing,
} from 'lucide-react';
import { useOutboundCalls, OutboundCallWithConversation } from '@/hooks/useOutboundCalls';
import { Slider } from '@/components/ui/slider';
import { useAgents } from '@/hooks/useAgents';
import { OutboundCallDetail } from '@/components/conversations/OutboundCallDetail';
import { ShareCallDialog } from '@/components/conversations/ShareCallDialog';
import { getAgentIcon } from '@/components/agents/AgentIconPicker';
import { useToast } from '@/hooks/use-toast';

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
  const { outboundCalls, isLoading, cancelCall, markAsRead } = useOutboundCalls(agentId);
  const { agents } = useAgents();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareCall, setShareCall] = useState<OutboundCallWithConversation | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { toast } = useToast();

  const getAgentName = (id: string) => {
    const agent = agents.find(a => a.id === id);
    return agent?.name || '不明';
  };

  const getStatusBadge = (status: string, result?: string | null, isMobile: boolean = false) => {
    if (isMobile) {
      // Mobile: icon only
      switch (status) {
        case 'scheduled':
          return (
            <div className="h-8 w-8 rounded-full bg-slate-500/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
          );
        case 'initiating':
        case 'ringing':
          return (
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            </div>
          );
        case 'in_progress':
          return (
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Phone className="h-4 w-4 text-emerald-400" />
            </div>
          );
        case 'completed':
          if (result === 'answered') {
            return (
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            );
          } else if (result === 'busy' || result === 'no_answer') {
            return (
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <PhoneOff className="h-4 w-4 text-amber-400" />
              </div>
            );
          }
          return (
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          );
        case 'failed':
          return (
            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          );
        case 'canceled':
          return (
            <div className="h-8 w-8 rounded-full bg-slate-500/20 flex items-center justify-center">
              <X className="h-4 w-4 text-slate-400" />
            </div>
          );
        default:
          return null;
      }
    }

    // Desktop: full badge
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30 gap-1.5 px-3 py-1">
            <Calendar className="h-3.5 w-3.5" />
            予約済み
          </Badge>
        );
      case 'initiating':
      case 'ringing':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 gap-1.5 px-3 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            発信中
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 gap-1.5 px-3 py-1">
            <Phone className="h-3.5 w-3.5" />
            通話中
          </Badge>
        );
      case 'completed':
        if (result === 'answered') {
          return (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 gap-1.5 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              完了
            </Badge>
          );
        } else if (result === 'busy') {
          return (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 gap-1.5 px-3 py-1">
              <PhoneOff className="h-3.5 w-3.5" />
              話し中
            </Badge>
          );
        } else if (result === 'no_answer') {
          return (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 gap-1.5 px-3 py-1">
              <Clock className="h-3.5 w-3.5" />
              応答なし
            </Badge>
          );
        }
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 gap-1.5 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            完了
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 gap-1.5 px-3 py-1">
            <XCircle className="h-3.5 w-3.5" />
            失敗
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30 gap-1.5 px-3 py-1">
            <X className="h-3.5 w-3.5" />
            キャンセル
          </Badge>
        );
      default:
        return <Badge className="font-normal">{status}</Badge>;
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredCalls = useMemo(() => {
    return outboundCalls.filter((call) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const callDate = new Date(call.created_at);

      if (dateFilter === "today") {
        return callDate >= today;
      } else if (dateFilter === "week") {
        return callDate >= weekAgo;
      } else if (dateFilter === "month") {
        return callDate >= monthAgo;
      }
      return true;
    });
  }, [outboundCalls, dateFilter]);

  const handleSelectCall = useCallback((call: OutboundCallWithConversation) => {
    setSelectedCallId(prevId => {
      const newId = prevId === call.id ? null : call.id;
      if (newId && !call.is_read) {
        markAsRead(call.id);
      }
      return newId;
    });
  }, [markAsRead]);

  const generateShareText = useCallback((call: OutboundCallWithConversation) => {
    const callDate = format(new Date(call.created_at), 'yyyy年M月d日 HH:mm', { locale: ja });
    
    let text = `📞 発信記録\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    text += `エージェント: ${getAgentName(call.agent_id)}\n`;
    text += `発信先: ${call.to_number}\n`;
    text += `日時: ${callDate}\n`;
    if (call.duration_seconds) {
      text += `通話時間: ${formatDuration(call.duration_seconds)}\n`;
    }
    text += `━━━━━━━━━━━━━━━\n\n`;
    
    if (call.conversation?.summary) {
      text += `📝 要約\n${call.conversation.summary}\n\n`;
    }
    
    if (call.conversation?.key_points && Array.isArray(call.conversation.key_points) && call.conversation.key_points.length > 0) {
      text += `💡 重要ポイント\n`;
      (call.conversation.key_points as string[]).forEach((point: string, i: number) => {
        text += `  ${i + 1}. ${point}\n`;
      });
      text += '\n';
    }
    
    return text;
  }, [getAgentName]);

  const handleCopyToClipboard = useCallback(async (call: OutboundCallWithConversation) => {
    const text = generateShareText(call);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `発信記録 - ${getAgentName(call.agent_id)}`,
          text: text,
        });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({
        title: "コピーしました",
        description: "発信記録をクリップボードにコピーしました",
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  }, [generateShareText, getAgentName, toast]);

  const handleOpenShareDialog = useCallback((call: OutboundCallWithConversation) => {
    setShareCall(call);
    setShareDialogOpen(true);
  }, []);

  const selectedCall = filteredCalls.find(c => c.id === selectedCallId);

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
          <PhoneOutgoing className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">発信履歴がありません</h3>
        <p className="text-sm text-muted-foreground">
          発信すると、ここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Pills */}
      <div className="border-b border-border bg-muted/30">
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 sm:gap-2 p-3 sm:p-4">
            {[
              { value: "all" as const, label: "すべて" },
              { value: "today" as const, label: "今日" },
              { value: "week" as const, label: "今週" },
              { value: "month" as const, label: "今月" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(option.value)}
                className={`text-xs h-8 px-4 rounded-full whitespace-nowrap ${
                  dateFilter === option.value 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {selectedCall ? (
          /* Expanded Detail View */
          <div className="flex flex-col">
            <button
              onClick={() => setSelectedCallId(null)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-accent/50 transition-colors border-b border-border"
            >
              <ChevronDown className="h-4 w-4" />
              <span>一覧に戻る</span>
            </button>

            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{selectedCall.to_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(selectedCall.created_at), 'M月d日 HH:mm', { locale: ja })} · {formatDuration(selectedCall.duration_seconds)}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      共有
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleCopyToClipboard(selectedCall)}>
                      <Copy className="h-4 w-4 mr-2" />
                      クリップボードにコピー
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenShareDialog(selectedCall)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Slackに送信
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenShareDialog(selectedCall)}>
                      <Mail className="h-4 w-4 mr-2" />
                      メールで送信
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-4 pb-24">
              {selectedCall.conversation ? (
                <OutboundCallDetail
                  conversation={{
                    summary: selectedCall.conversation.summary,
                    key_points: selectedCall.conversation.key_points as string[] | null,
                    transcript: selectedCall.conversation.transcript as any,
                    audio_url: selectedCall.conversation.audio_url,
                    extracted_data: selectedCall.conversation.extracted_data,
                  }}
                  agentIconName={agents.find(a => a.id === selectedCall.agent_id)?.icon_name || 'Bot'}
                  agentIconColor={agents.find(a => a.id === selectedCall.agent_id)?.icon_color || '#6366f1'}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>この通話の詳細情報はまだありません</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View - Card List */}
            <div className="sm:hidden">
              {filteredCalls.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <PhoneOutgoing className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">該当する発信がありません</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredCalls.map((call, index) => {
                    const callDate = new Date(call.created_at);
                    const showDateSeparator = index === 0 || 
                      format(callDate, 'yyyy-MM-dd') !== format(new Date(filteredCalls[index - 1].created_at), 'yyyy-MM-dd');

                    return (
                      <React.Fragment key={call.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center py-3 bg-muted/20">
                            <span className="text-[11px] text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full">
                              {isToday(callDate) ? '今日' : 
                               isYesterday(callDate) ? '昨日' : 
                               format(callDate, 'M月d日（E）', { locale: ja })}
                            </span>
                          </div>
                        )}
                        <div 
                          className={`flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors ${
                            !call.is_read ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleSelectCall(call)}
                        >
                          {/* Status Indicator */}
                          <div className="shrink-0 w-2">
                            <div className={`h-2 w-2 rounded-full ${
                              call.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 
                              !call.is_read ? 'bg-primary' : 'bg-transparent'
                            }`} />
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-11 w-11 border-2 border-background shadow-sm shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                              <PhoneOutgoing className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-foreground truncate text-sm">
                                {call.to_number}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {format(callDate, 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {!agentId && `${getAgentName(call.agent_id)} · `}
                              {call.conversation?.summary || 
                               (call.duration_seconds ? `通話時間: ${formatDuration(call.duration_seconds)}` : 
                                call.status === 'scheduled' ? '予約済み' : '発信')}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {getStatusBadge(call.status, call.result, true)}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-8 text-muted-foreground font-normal text-xs"></TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs">発信先</TableHead>
                    {!agentId && <TableHead className="text-muted-foreground font-normal text-xs">エージェント</TableHead>}
                    <TableHead className="text-muted-foreground font-normal text-xs">概要</TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs">時間</TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs text-right">ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={agentId ? 5 : 6} className="h-32 text-center text-muted-foreground">
                        該当する発信がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalls.map((call, index) => {
                      const callDate = new Date(call.created_at);
                      const showDateSeparator = index === 0 || 
                        format(callDate, 'yyyy-MM-dd') !== format(new Date(filteredCalls[index - 1].created_at), 'yyyy-MM-dd');

                      return (
                        <React.Fragment key={call.id}>
                          {showDateSeparator && (
                            <TableRow className="hover:bg-transparent border-0">
                              <TableCell colSpan={agentId ? 5 : 6} className="py-3 px-0">
                                <div className="flex items-center gap-3">
                                  <div className="h-px bg-border flex-1" />
                                  <span className="text-xs text-muted-foreground font-medium px-3 py-1 bg-muted/50 rounded-full">
                                    {isToday(callDate) ? '今日' : 
                                     isYesterday(callDate) ? '昨日' : 
                                     format(callDate, 'M月d日（E）', { locale: ja })}
                                  </span>
                                  <div className="h-px bg-border flex-1" />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              !call.is_read ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => handleSelectCall(call)}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center justify-center">
                                <div className={`h-2 w-2 rounded-full ${
                                  call.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 
                                  !call.is_read ? 'bg-primary' : 'bg-transparent'
                                }`} />
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs">
                                    <PhoneOutgoing className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-mono text-sm">{call.to_number}</span>
                              </div>
                            </TableCell>
                            {!agentId && (
                              <TableCell className="py-3 text-sm text-muted-foreground">
                                {getAgentName(call.agent_id)}
                              </TableCell>
                            )}
                            <TableCell className="py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                              {call.conversation?.summary || '-'}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col text-xs">
                                <span className="text-foreground">
                                  {format(callDate, 'HH:mm')}
                                </span>
                                {call.duration_seconds && (
                                  <span className="text-muted-foreground">
                                    {formatDuration(call.duration_seconds)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {getStatusBadge(call.status, call.result)}
                                {(call.status === 'scheduled' || call.status === 'initiating') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelCall(call.id);
                                    }}
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                                  >
                                    キャンセル
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Share Dialog */}
      {shareCall && (
        <ShareCallDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          callId={shareCall.id}
          toNumber={shareCall.to_number}
        />
      )}
    </div>
  );
}