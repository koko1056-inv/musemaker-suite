import { memo } from "react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import type { TranscriptMessage } from "./types";

interface ChatBubbleProps {
  message: TranscriptMessage;
  isAgent: boolean;
  agentIcon: string;
  agentColor: string;
  showAvatar: boolean;
}

export const ChatBubble = memo(function ChatBubble({ 
  message, 
  isAgent, 
  agentIcon, 
  agentColor,
  showAvatar 
}: ChatBubbleProps) {
  const IconComponent = getAgentIcon(agentIcon);
  
  return (
    <div className={`flex gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}>
      {isAgent && showAvatar && (
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: agentColor }}
        >
          <IconComponent className="h-4 w-4 text-white" />
        </div>
      )}
      {isAgent && !showAvatar && <div className="w-8 shrink-0" />}
      
      <div
        className={`max-w-[75%] px-4 py-2.5 ${
          isAgent
            ? 'bg-muted rounded-2xl rounded-tl-md'
            : 'bg-[#06C755] text-white rounded-2xl rounded-tr-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
});