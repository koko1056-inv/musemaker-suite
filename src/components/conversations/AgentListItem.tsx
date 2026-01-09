import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, PhoneOutgoing, ChevronRight } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { formatRelativeDate } from "./utils";
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
          ) : agent.totalConversations > 1 ? (
            <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-muted rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground">{agent.totalConversations}</span>
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
              {formatRelativeDate(lastConv.rawDate)}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {lastConv.summary 
              ? lastConv.summary 
              : lastConv.transcript.length > 0 
                ? lastConv.transcript[lastConv.transcript.length - 1]?.text 
                : `通話時間 ${lastConv.duration}`
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

      {/* Phone Number Assignment */}
      {phoneNumbers.length > 0 && (
        <div className="mt-2 ml-15 pl-[60px]" onClick={(e) => e.stopPropagation()}>
          <Select
            value={assignedPhone?.phone_number_sid || "none"}
            onValueChange={(value) => onPhoneAssign(agent.agentId, value)}
          >
            <SelectTrigger className="h-8 text-xs w-full max-w-[200px]">
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
