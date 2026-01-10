import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, PhoneOutgoing, MessageSquare } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import type { AgentConversations, PhoneNumberInfo } from "./types";

interface AgentListItemProps {
  agent: AgentConversations;
  isSelected: boolean;
  onClick: () => void;
  onCall: () => void;
  phoneNumbers: PhoneNumberInfo[];
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
}

const AgentListItemComponent = ({ 
  agent, 
  isSelected, 
  onClick,
  onCall,
  phoneNumbers,
  onPhoneAssign,
}: AgentListItemProps) => {
  const lastConv = agent.lastConversation;
  const IconComponent = getAgentIcon(agent.iconName);
  const assignedPhone = phoneNumbers.find(p => p.agent_id === agent.agentId);
  
  // Determine status for indicator dot
  const hasUnread = agent.unreadCount > 0;
  const hasInProgress = agent.conversations.some(c => c.status === 'in_progress');

  // Get action button color based on status
  const getActionButtonStyle = () => {
    if (hasInProgress) {
      return "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30";
    }
    if (hasUnread) {
      return "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30";
    }
    return "bg-muted/50 text-muted-foreground hover:bg-muted border-muted";
  };
  
  return (
    <div
      className={`px-4 py-4 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/8' 
          : 'hover:bg-muted/30'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="shrink-0 w-3 flex justify-center">
          <div className={`h-2.5 w-2.5 rounded-full ${
            hasInProgress ? 'bg-emerald-400 animate-pulse' :
            hasUnread ? 'bg-blue-500' :
            'bg-muted-foreground/30'
          }`} />
        </div>

        {/* Agent Avatar */}
        <div className="relative shrink-0">
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center shadow-md ring-2 ring-background"
            style={{ backgroundColor: agent.iconColor }}
          >
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          {/* Small indicator badge */}
          {hasInProgress && (
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
              <Phone className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {agent.agentName}
          </h3>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {lastConv.summary 
              ? lastConv.summary 
              : lastConv.transcript.length > 0 
                ? lastConv.transcript[lastConv.transcript.length - 1]?.text 
                : `${agent.totalConversations}件の会話`
            }
          </p>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className={`shrink-0 gap-1.5 rounded-full h-9 px-4 border ${getActionButtonStyle()}`}
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
        >
          {hasInProgress ? (
            <>
              <Phone className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">通話中</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{agent.totalConversations}件</span>
            </>
          )}
        </Button>
      </div>

      {/* Phone Number Assignment */}
      {phoneNumbers.length > 0 && (
        <div className="mt-3 ml-[76px]" onClick={(e) => e.stopPropagation()}>
          <Select
            value={assignedPhone?.phone_number_sid || "none"}
            onValueChange={(value) => onPhoneAssign(agent.agentId, value)}
          >
            <SelectTrigger className="h-8 text-xs w-full max-w-[200px] bg-muted/30 border-muted">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <SelectValue>
                  {assignedPhone ? (
                    <span className="font-mono text-xs">{assignedPhone.phone_number}</span>
                  ) : (
                    <span className="text-muted-foreground">電話番号を割り当て</span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">未割り当て</span>
              </SelectItem>
              {phoneNumbers.map((phone) => (
                <SelectItem 
                  key={phone.phone_number_sid} 
                  value={phone.phone_number_sid}
                  disabled={phone.agent_id !== null && phone.agent_id !== agent.agentId}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{phone.phone_number}</span>
                    {phone.label && (
                      <span className="text-muted-foreground text-xs">({phone.label})</span>
                    )}
                    {phone.agent_id && phone.agent_id !== agent.agentId && (
                      <span className="text-muted-foreground text-xs">(使用中)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export const AgentListItem = React.memo(AgentListItemComponent);
