import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  Plus,
  Bot,
  Zap,
  Phone,
  Folder,
  FolderOpen,
} from "lucide-react";
import { PixelAgentCard } from "./PixelAgentCard";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  voice_id: string;
  status: "draft" | "published";
  elevenlabs_agent_id: string | null;
  folder_id: string | null;
}

interface PhoneNumber {
  phone_number_sid: string;
  phone_number: string;
  label: string | null;
  agent_id: string | null;
}

interface AgentFolder {
  id: string;
  name: string;
  color: string;
}

interface FolderSectionProps {
  folder: AgentFolder;
  agents: Agent[];
  allFolders: AgentFolder[];
  phoneNumbers: PhoneNumber[];
  defaultOpen?: boolean;
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onMoveToFolder: (agentId: string, folderId: string | null) => void;
  getAgentPhoneNumber: (agentId: string) => PhoneNumber | undefined;
}

export function FolderSection({
  folder,
  agents,
  allFolders,
  phoneNumbers,
  defaultOpen = false,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder,
  getAgentPhoneNumber,
}: FolderSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const activeAgents = agents.filter(a => a.status === 'published' && a.elevenlabs_agent_id);
  const agentsWithPhone = agents.filter(a => phoneNumbers.some(p => p.agent_id === a.id));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-card hover:bg-accent/50 border border-border transition-all group">
          {/* Folder Icon */}
          <div 
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${folder.color}20` }}
          >
            {isOpen ? (
              <FolderOpen className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: folder.color }} />
            ) : (
              <Folder className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: folder.color }} />
            )}
          </div>
          
          <div className="flex-1 text-left min-w-0">
            {/* Folder Name */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate text-base sm:text-lg">
                {folder.name}
              </h3>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Agent Count */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                <Bot className="h-3 w-3" />
                <span className="font-medium">{agents.length}</span>
              </div>
              
              {/* Active Status */}
              {activeAgents.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">{activeAgents.length}</span>
                  <span className="hidden sm:inline">稼働中</span>
                </div>
              )}
              
              {/* Phone Count */}
              {agentsWithPhone.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                  <Phone className="h-3 w-3" />
                  <span className="font-medium">{agentsWithPhone.length}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Arrow Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge 
              variant="secondary" 
              className="hidden sm:flex text-xs font-normal"
            >
              {agents.length}件のエージェント
            </Badge>
            <div className={`h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center transition-all ${isOpen ? 'rotate-90 bg-primary/10' : ''}`}>
              <ChevronRight className={`h-4 w-4 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3 ml-0 sm:ml-6 pl-0 sm:pl-4 sm:border-l-2 border-border/50">
          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl bg-muted/10">
              <div 
                className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${folder.color}10` }}
              >
                <Folder className="h-8 w-8 opacity-30" style={{ color: folder.color }} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                このフォルダにはエージェントがありません
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
                <Link to="/agents/new">
                  <Plus className="h-4 w-4" />
                  エージェントを作成
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent, index) => (
                <PixelAgentCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                  phoneNumbers={phoneNumbers}
                  folders={allFolders}
                  assignedPhone={getAgentPhoneNumber(agent.id)}
                  onPhoneAssign={onPhoneAssign}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onMoveToFolder={onMoveToFolder}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
