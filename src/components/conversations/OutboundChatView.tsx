import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Lightbulb, 
  Variable,
  X
} from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { format, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { AudioPlayer } from "./AudioPlayer";
import { ChatBubble } from "./ChatBubble";
import { OutboundStatusBadge } from "./OutboundStatusBadge";
import type { OutboundAgentInfo, TranscriptMessage } from "./types";

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
  const IconComponent = getAgentIcon(agent.iconName);

  const handleSelectCall = useCallback((call: any) => {
    const hasConversation = call.conversation && (
      (call.conversation.transcript && call.conversation.transcript.length > 0) ||
      call.conversation.summary
    );
    if (!hasConversation) return;
    
    setSelectedCallId(prevId => {
      const newId = prevId === call.id ? null : call.id;
      if (newId && !call.is_read) {
        onMarkAsRead(call.id);
      }
      return newId;
    });
  }, [onMarkAsRead]);

  const formatDuration = useCallback((seconds?: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-background border-b border-border sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div 
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shadow-sm shrink-0"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate text-sm sm:text-base">{agent.agentName}</h2>
          <p className="text-xs text-muted-foreground">
            {agent.totalCalls}件の発信
          </p>
        </div>
      </div>

      {/* Call List */}
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {agent.calls.map((call, index) => {
            const callDate = new Date(call.created_at);
            const isExpanded = selectedCallId === call.id;
            const hasConversation = call.conversation && (
              (call.conversation.transcript && call.conversation.transcript.length > 0) ||
              call.conversation.summary
            );
            const showDateSeparator = index === 0 || 
              format(callDate, 'yyyy-MM-dd') !== format(new Date(agent.calls[index - 1].created_at), 'yyyy-MM-dd');

            return (
              <div key={call.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                      {isToday(callDate) ? '今日' : 
                       isYesterday(callDate) ? '昨日' : 
                       format(callDate, 'M月d日（E）', { locale: ja })}
                    </div>
                  </div>
                )}

                {/* Call Card */}
                <div 
                  className={`bg-muted/30 rounded-2xl overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'ring-1 ring-primary/20' : hasConversation ? 'hover:bg-muted/50 cursor-pointer' : ''
                  } ${!call.is_read && !isExpanded ? 'border-l-4 border-l-primary' : ''}`}
                >
                  {/* Header */}
                  <div 
                    className="flex items-center gap-3 p-3 sm:p-4"
                    onClick={() => handleSelectCall(call)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-sm flex-wrap">
                        <span className="font-medium">
                          {format(callDate, 'HH:mm')}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">{call.to_number}</span>
                        {call.duration_seconds && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration_seconds)}
                          </span>
                        )}
                      </div>
                      {hasConversation && call.conversation?.summary && (
                        <p className={`text-sm text-muted-foreground mt-1 ${isExpanded ? '' : 'line-clamp-1'}`}>
                          {call.conversation.summary}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <OutboundStatusBadge status={call.status} result={call.result} />
                      {call.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelCall(call.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && call.conversation && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border/50">
                      <div className="pt-3 sm:pt-4 space-y-4">
                        {/* Summary */}
                        {call.conversation.summary && (
                          <div className="bg-muted/30 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">AI要約</p>
                                <p className="text-sm leading-relaxed">{call.conversation.summary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Key Points */}
                        {call.conversation.key_points && call.conversation.key_points.length > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">重要ポイント</span>
                            </div>
                            <ul className="space-y-1.5">
                              {call.conversation.key_points.map((point: string, i: number) => (
                                <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                                  <span className="text-amber-500 mt-1">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Extracted Data */}
                        {call.conversation.extracted_data && (call.conversation.extracted_data as Array<{ field_key: string; field_value: string | null }>).length > 0 && (
                          <div className="bg-violet-50 dark:bg-violet-950/30 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Variable className="h-4 w-4 text-violet-600" />
                              <span className="text-sm font-medium text-violet-800 dark:text-violet-200">抽出データ</span>
                            </div>
                            <div className="grid gap-2">
                              {(call.conversation.extracted_data as Array<{ field_key: string; field_value: string | null }>).map((item) => {
                                const agentFieldMap = extractionFieldNameMap.get(call.agent_id);
                                const fieldName = agentFieldMap?.get(item.field_key);
                                return (
                                  <div key={item.field_key} className="flex items-start justify-between gap-2 text-sm">
                                    <div className="flex flex-col gap-0.5">
                                      {fieldName && (
                                        <span className="text-violet-800 dark:text-violet-200 text-xs font-medium">
                                          {fieldName}
                                        </span>
                                      )}
                                      <span className="text-violet-600 dark:text-violet-400 font-mono text-xs bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded inline-block w-fit">
                                        {item.field_key}
                                      </span>
                                    </div>
                                    <span className="text-violet-900 dark:text-violet-100 text-right flex-1 truncate font-medium">
                                      {item.field_value || '-'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {call.conversation.audio_url && (
                          <div className="flex justify-center">
                            <AudioPlayer audioUrl={call.conversation.audio_url} />
                          </div>
                        )}

                        {/* Transcript */}
                        {call.conversation.transcript && call.conversation.transcript.length > 0 && (
                          <div className="space-y-2">
                            {(call.conversation.transcript as TranscriptMessage[]).map((msg, i, arr) => {
                              const prevMsg = arr[i - 1];
                              const showAvatar = !prevMsg || prevMsg.role !== msg.role;
                              
                              return (
                                <ChatBubble
                                  key={i}
                                  message={msg}
                                  isAgent={msg.role === 'agent'}
                                  agentIcon={agent.iconName}
                                  agentColor={agent.iconColor}
                                  showAvatar={showAvatar}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export const OutboundChatView = React.memo(OutboundChatViewComponent);
