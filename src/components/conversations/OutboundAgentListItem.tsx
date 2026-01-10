import React from "react";
import { Button } from "@/components/ui/button";
import { PhoneOutgoing, MessageSquare, Phone } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import type { OutboundAgentInfo } from "./types";

interface OutboundAgentListItemProps {
  agent: OutboundAgentInfo;
  isSelected: boolean;
  onClick: () => void;
  onCall: () => void;
}

const OutboundAgentListItemComponent = ({ 
  agent, 
  isSelected, 
  onClick,
  onCall,
}: OutboundAgentListItemProps) => {
  const lastCall = agent.lastCall;
  const IconComponent = getAgentIcon(agent.iconName);
  const hasConversation = lastCall.conversation?.summary || lastCall.conversation?.transcript?.length > 0;
  
  // Check for active/scheduled calls
  const hasUnread = agent.unreadCount > 0;
  const hasActiveCall = agent.calls.some(c => c.status === 'in_progress' || c.status === 'initiating');
  const hasScheduled = agent.calls.some(c => c.status === 'scheduled');

  // Get action button color based on status
  const getActionButtonStyle = () => {
    if (hasActiveCall) {
      return "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30";
    }
    if (hasScheduled) {
      return "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30";
    }
    if (hasUnread) {
      return "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30";
    }
    return "bg-muted/50 text-muted-foreground hover:bg-muted border-muted";
  };
  
  return (
    <div
      className={`px-3 sm:px-4 py-4 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/8' 
          : 'hover:bg-muted/30'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Agent Avatar */}
        <div className="relative shrink-0">
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center shadow-md ring-2 ring-background overflow-hidden"
            style={{ backgroundColor: agent.customIconUrl ? 'transparent' : agent.iconColor }}
          >
            {agent.customIconUrl ? (
              <img 
                src={agent.customIconUrl} 
                alt={agent.agentName} 
                className="h-full w-full object-cover"
              />
            ) : (
              <IconComponent className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {agent.agentName}
          </h3>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {hasConversation && lastCall.conversation?.summary
              ? lastCall.conversation.summary 
              : `${agent.totalCalls}件の発信`
            }
          </p>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className={`shrink-0 gap-1 sm:gap-1.5 rounded-full h-9 px-3 sm:px-4 border ${getActionButtonStyle()}`}
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
        >
          {hasActiveCall ? (
            <>
              <Phone className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">発信中</span>
            </>
          ) : hasScheduled ? (
            <>
              <PhoneOutgoing className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">予約中</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{agent.totalCalls}件</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const OutboundAgentListItem = React.memo(OutboundAgentListItemComponent);
