import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { format, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { OutboundCallCard } from "./OutboundCallCard";
import { OutboundCallDetail } from "./OutboundCallDetail";
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

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header - LINE style sticky header */}
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
          /* Expanded Detail View - Full screen like LINE chat */
          <div className="flex flex-col">
            {/* Back to list header */}
            <button
              onClick={() => setSelectedCallId(null)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-accent/50 transition-colors border-b border-border"
            >
              <ChevronDown className="h-4 w-4" />
              <span>通話一覧に戻る</span>
            </button>

            {/* Call info header */}
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{selectedCall.to_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(selectedCall.created_at), 'M月d日 HH:mm', { locale: ja })}
                    {selectedCall.duration_seconds && (
                      <span> · {Math.floor(selectedCall.duration_seconds / 60)}:{(selectedCall.duration_seconds % 60).toString().padStart(2, '0')}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation Detail */}
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
          /* Call List View */
          <div className="p-3 pb-24 space-y-2">
            {agent.calls.map((call, index) => {
              const callDate = new Date(call.created_at);
              const showDateSeparator = index === 0 || 
                format(callDate, 'yyyy-MM-dd') !== format(new Date(agent.calls[index - 1].created_at), 'yyyy-MM-dd');

              return (
                <React.Fragment key={call.id}>
                  {/* Date Separator - LINE style */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center py-2">
                      <div className="bg-muted text-muted-foreground text-[11px] px-3 py-1 rounded-full font-medium">
                        {isToday(callDate) ? '今日' : 
                         isYesterday(callDate) ? '昨日' : 
                         format(callDate, 'M月d日（E）', { locale: ja })}
                      </div>
                    </div>
                  )}

                  <OutboundCallCard
                    call={{
                      id: call.id,
                      to_number: call.to_number,
                      status: call.status,
                      result: call.result,
                      duration_seconds: call.duration_seconds,
                      is_read: call.is_read,
                      created_at: call.created_at,
                      conversation: call.conversation,
                    }}
                    isExpanded={false}
                    onSelect={() => handleSelectCall(call.id, call.is_read)}
                    onCancel={cancelCall}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export const OutboundChatView = React.memo(OutboundChatViewComponent);
