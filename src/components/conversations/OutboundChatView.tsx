import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChevronDown, Share2, Copy, Check, MessageSquare, Mail, Phone, PhoneOff, Clock, CheckCircle2, XCircle, Loader2, Calendar, X, ChevronRight } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { format, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { OutboundCallDetail } from "./OutboundCallDetail";
import { ShareCallDialog } from "./ShareCallDialog";
import { useToast } from "@/hooks/use-toast";
import type { OutboundAgentInfo, TranscriptMessage } from "./types";
import { Badge } from "@/components/ui/badge";

interface OutboundChatViewProps {
  agent: OutboundAgentInfo;
  onBack: () => void;
  cancelCall: (id: string) => void;
  onMarkAsRead: (callId: string) => void;
  extractionFieldNameMap: Map<string, Map<string, string>>;
}

const OutboundChatViewComponent = ({ 
  agent,
  onBack,
  cancelCall,
  onMarkAsRead,
  extractionFieldNameMap,
}: OutboundChatViewProps) => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { toast } = useToast();
  const IconComponent = getAgentIcon(agent.iconName);

  const handleSelectCall = useCallback((callId: string, isRead: boolean) => {
    setSelectedCallId(prevId => {
      const newId = prevId === callId ? null : callId;
      if (newId && !isRead) {
        onMarkAsRead(callId);
      }
      return newId;
    });
  }, [onMarkAsRead]);

  const selectedCall = agent.calls.find(c => c.id === selectedCallId);

  const generateShareText = useCallback(() => {
    if (!selectedCall?.conversation) return '';
    
    const callDate = format(new Date(selectedCall.created_at), 'yyyy年M月d日 HH:mm', { locale: ja });
    const duration = selectedCall.duration_seconds 
      ? `${Math.floor(selectedCall.duration_seconds / 60)}分${selectedCall.duration_seconds % 60}秒`
      : '';
    
    let text = `📞 通話記録\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    text += `エージェント: ${agent.agentName}\n`;
    text += `発信先: ${selectedCall.to_number}\n`;
    text += `日時: ${callDate}\n`;
    if (duration) text += `通話時間: ${duration}\n`;
    text += `━━━━━━━━━━━━━━━\n\n`;
    
    if (selectedCall.conversation.summary) {
      text += `📝 要約\n${selectedCall.conversation.summary}\n\n`;
    }
    
    if (selectedCall.conversation.key_points && (selectedCall.conversation.key_points as string[]).length > 0) {
      text += `💡 重要ポイント\n`;
      (selectedCall.conversation.key_points as string[]).forEach((point, i) => {
        text += `  ${i + 1}. ${point}\n`;
      });
      text += '\n';
    }
    
    if (selectedCall.conversation.extracted_data && (selectedCall.conversation.extracted_data as Array<{ field_key: string; field_value: string | null }>).length > 0) {
      text += `📊 抽出データ\n`;
      (selectedCall.conversation.extracted_data as Array<{ field_key: string; field_value: string | null }>).forEach(item => {
        const fieldMap = extractionFieldNameMap.get(selectedCall.agent_id);
        const fieldName = fieldMap?.get(item.field_key) || item.field_key;
        text += `  ${fieldName}: ${item.field_value || '-'}\n`;
      });
      text += '\n';
    }
    
    if (selectedCall.conversation.transcript && (selectedCall.conversation.transcript as TranscriptMessage[]).length > 0) {
      text += `💬 会話ログ\n`;
      (selectedCall.conversation.transcript as TranscriptMessage[]).forEach(msg => {
        const role = msg.role === 'agent' ? '🤖 AI' : '👤 ユーザー';
        text += `${role}: ${msg.text}\n`;
      });
    }
    
    return text;
  }, [selectedCall, agent.agentName, extractionFieldNameMap]);

  const handleShare = useCallback(async () => {
    const text = generateShareText();
    if (!text) return;
    
    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `通話記録 - ${agent.agentName}`,
          text: text,
        });
        return;
      } catch (err) {
        // User cancelled or error, fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast({
        title: "コピーしました",
        description: "通話内容をクリップボードにコピーしました",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  }, [generateShareText, agent.agentName, toast]);

  const getStatusBadge = (status: string, result?: string | null) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-slate-500/20 text-slate-500 border-slate-500/30 hover:bg-slate-500/30 gap-1 px-2 py-0.5 text-[10px]">
            <Calendar className="h-3 w-3" />
            予約済み
          </Badge>
        );
      case 'initiating':
      case 'ringing':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 hover:bg-blue-500/30 gap-1 px-2 py-0.5 text-[10px]">
            <Loader2 className="h-3 w-3 animate-spin" />
            発信中
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30 gap-1 px-2 py-0.5 text-[10px]">
            <Phone className="h-3 w-3" />
            通話中
          </Badge>
        );
      case 'completed':
        if (result === 'answered') {
          return (
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30 gap-1 px-2 py-0.5 text-[10px]">
              <CheckCircle2 className="h-3 w-3" />
              完了
            </Badge>
          );
        } else if (result === 'busy') {
          return (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 gap-1 px-2 py-0.5 text-[10px]">
              <PhoneOff className="h-3 w-3" />
              話し中
            </Badge>
          );
        } else if (result === 'no_answer') {
          return (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 gap-1 px-2 py-0.5 text-[10px]">
              <Clock className="h-3 w-3" />
              応答なし
            </Badge>
          );
        }
        return (
          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30 gap-1 px-2 py-0.5 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            完了
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30 gap-1 px-2 py-0.5 text-[10px]">
            <XCircle className="h-3 w-3" />
            失敗
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-slate-500/20 text-slate-500 border-slate-500/30 hover:bg-slate-500/30 gap-1 px-2 py-0.5 text-[10px]">
            <X className="h-3 w-3" />
            キャンセル
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 shrink-0 -ml-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm shrink-0"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{agent.agentName}</h2>
          <p className="text-xs text-muted-foreground">
            {agent.totalCalls}件の発信
          </p>
        </div>
      </div>

      {/* Call List or Detail View */}
      <ScrollArea className="flex-1">
        {selectedCall ? (
          /* Expanded Detail View */
          <div className="flex flex-col">
            <button
              onClick={() => setSelectedCallId(null)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-accent/50 transition-colors border-b border-border"
            >
              <ChevronDown className="h-4 w-4" />
              <span>通話一覧に戻る</span>
            </button>

            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{selectedCall.to_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(selectedCall.created_at), 'M月d日 HH:mm', { locale: ja })}
                    {selectedCall.duration_seconds && (
                      <span> · {formatDuration(selectedCall.duration_seconds)}</span>
                    )}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleShare}>
                      <Copy className="h-4 w-4 mr-2" />
                      クリップボードにコピー
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Slackに送信
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                      <Mail className="h-4 w-4 mr-2" />
                      メールで送信
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {selectedCall.conversation && (
              <div className="p-4 pb-24">
                <OutboundCallDetail
                  conversation={{
                    summary: selectedCall.conversation.summary,
                    key_points: selectedCall.conversation.key_points as string[] | null,
                    transcript: selectedCall.conversation.transcript as TranscriptMessage[] | null,
                    audio_url: selectedCall.conversation.audio_url,
                    extracted_data: selectedCall.conversation.extracted_data as Array<{ field_key: string; field_value: string | null }> | null,
                  }}
                  agentIconName={agent.iconName}
                  agentIconColor={agent.iconColor}
                  extractionFieldNameMap={extractionFieldNameMap.get(selectedCall.agent_id)}
                />
              </div>
            )}
          </div>
        ) : (
          /* Call List View - Matching inbound history style */
          <div className="divide-y divide-border/30">
            {agent.calls.map((call, index) => {
              const callDate = new Date(call.created_at);
              const showDateSeparator = index === 0 || 
                format(callDate, 'yyyy-MM-dd') !== format(new Date(agent.calls[index - 1].created_at), 'yyyy-MM-dd');
              
              const hasConversation = call.conversation && (
                (call.conversation.transcript && call.conversation.transcript.length > 0) ||
                call.conversation.summary
              );

              return (
                <React.Fragment key={call.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center py-3 bg-muted/20">
                      <span className="text-[11px] text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full">
                        {isToday(callDate) ? '今日' : 
                         isYesterday(callDate) ? '昨日' : 
                         format(callDate, 'M月d日（E）', { locale: ja })}
                      </span>
                    </div>
                  )}

                  {/* Call Card - Matching inbound style */}
                  <div 
                    className={`bg-card rounded-xl mx-3 my-2 border border-border transition-all duration-200 overflow-hidden ${
                      hasConversation ? 'hover:bg-accent/50 cursor-pointer active:scale-[0.99]' : ''
                    } ${!call.is_read ? 'border-l-4 border-l-primary' : ''}`}
                    onClick={() => hasConversation && handleSelectCall(call.id, call.is_read)}
                  >
                    <div className="flex items-center gap-3 p-4">
                      {/* Phone Icon */}
                      <Avatar className="h-11 w-11 border-2 border-background shadow-sm shrink-0">
                        <AvatarFallback className={`${
                          call.status === 'completed' ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 
                          call.status === 'failed' ? 'bg-gradient-to-br from-red-600 to-red-700' : 
                          'bg-gradient-to-br from-blue-600 to-blue-700'
                        } text-white`}>
                          <Phone className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground">
                            {call.to_number}
                          </span>
                          {getStatusBadge(call.status, call.result)}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{format(callDate, 'HH:mm')}</span>
                          {formatDuration(call.duration_seconds) && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {formatDuration(call.duration_seconds)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Summary Preview */}
                        {hasConversation && call.conversation?.summary && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {call.conversation.summary}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {call.status === 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelCall(call.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {hasConversation && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Share Dialog */}
      {selectedCall && (
        <ShareCallDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          callId={selectedCall.id}
          toNumber={selectedCall.to_number}
        />
      )}
    </div>
  );
};

export const OutboundChatView = React.memo(OutboundChatViewComponent);
