import { Button } from "@/components/ui/button";
import { PhoneOutgoing, ChevronRight } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { formatRelativeDate } from "./utils";
import type { OutboundAgentInfo } from "./types";

interface OutboundAgentListItemProps {
  agent: OutboundAgentInfo;
  isSelected: boolean;
  onClick: () => void;
  onCall: () => void;
}

export function OutboundAgentListItem({ 
  agent, 
  isSelected, 
  onClick,
  onCall,
}: OutboundAgentListItemProps) {
  const lastCall = agent.lastCall;
  const IconComponent = getAgentIcon(agent.iconName);
  const lastCallDate = new Date(lastCall.created_at);
  const hasConversation = lastCall.conversation?.summary || lastCall.conversation?.transcript?.length > 0;
  
  return (
    <div
      className={`px-4 py-3 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/8' 
          : 'hover:bg-muted/50 active:bg-muted/70'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Agent Avatar */}
        <div className="relative shrink-0">
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center shadow-sm"
            style={{ backgroundColor: agent.iconColor }}
          >
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          {agent.unreadCount > 0 ? (
            <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-destructive-foreground">{agent.unreadCount}</span>
            </div>
          ) : agent.totalCalls > 1 ? (
            <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-muted rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground">{agent.totalCalls}</span>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground truncate">
              {agent.agentName}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeDate(lastCallDate)}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {hasConversation && lastCall.conversation?.summary
              ? lastCall.conversation.summary 
              : `${lastCall.to_number} への発信`
            }
          </p>
        </div>

        {/* Call Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0 text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
        >
          <PhoneOutgoing className="h-4 w-4" />
        </Button>

        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>
    </div>
  );
}
