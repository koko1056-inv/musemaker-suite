import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Phone, X, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { OutboundStatusBadge } from "./OutboundStatusBadge";

interface OutboundCall {
  id: string;
  to_number: string;
  status: string;
  result: string | null;
  duration_seconds: number | null;
  is_read: boolean;
  created_at: string;
  conversation?: {
    transcript?: unknown[];
    summary?: string | null;
  } | null;
}

interface OutboundCallCardProps {
  call: OutboundCall;
  isExpanded: boolean;
  onSelect: () => void;
  onCancel: (id: string) => void;
}

const OutboundCallCardComponent = ({
  call,
  isExpanded,
  onSelect,
  onCancel,
}: OutboundCallCardProps) => {
  const callDate = new Date(call.created_at);
  const hasConversation = call.conversation && (
    (call.conversation.transcript && call.conversation.transcript.length > 0) ||
    call.conversation.summary
  );

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`bg-card rounded-xl transition-all duration-200 overflow-hidden ${
        isExpanded ? 'ring-2 ring-primary/20 shadow-lg' : hasConversation ? 'hover:bg-accent/50 cursor-pointer active:scale-[0.99]' : ''
      } ${!call.is_read && !isExpanded ? 'border-l-4 border-l-primary' : 'border border-border'}`}
      onClick={() => hasConversation && onSelect()}
    >
      {/* Main Content */}
      <div className="flex items-center gap-3 p-3">
        {/* Phone Icon */}
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          call.status === 'completed' ? 'bg-primary/10' : 
          call.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
        }`}>
          <Phone className={`h-4 w-4 ${
            call.status === 'completed' ? 'text-primary' : 
            call.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">
              {call.to_number}
            </span>
            <OutboundStatusBadge status={call.status} result={call.result} />
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
          {hasConversation && call.conversation?.summary && !isExpanded && (
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
                onCancel(call.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {hasConversation && !isExpanded && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
};

export const OutboundCallCard = React.memo(OutboundCallCardComponent);
