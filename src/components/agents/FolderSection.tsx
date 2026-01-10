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
  ChevronDown,
  Plus,
  Users,
  Zap,
  Phone,
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

// Pixel art folder icon
const PixelFolderIcon = ({ color, isOpen }: { color: string; isOpen: boolean }) => (
  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center" style={{ imageRendering: 'pixelated' as const }}>
    <svg viewBox="0 0 16 16" className="w-full h-full">
      {isOpen ? (
        <>
          {/* Open folder */}
          <rect x="1" y="4" width="14" height="2" fill={color} />
          <rect x="2" y="6" width="12" height="8" fill={color} opacity="0.8" />
          <rect x="3" y="3" width="5" height="2" fill={color} />
          {/* Folder content preview */}
          <rect x="4" y="8" width="3" height="2" fill="white" opacity="0.3" />
          <rect x="8" y="8" width="3" height="2" fill="white" opacity="0.3" />
        </>
      ) : (
        <>
          {/* Closed folder */}
          <rect x="1" y="5" width="14" height="9" fill={color} />
          <rect x="2" y="4" width="5" height="2" fill={color} />
          <rect x="2" y="6" width="12" height="1" fill="white" opacity="0.2" />
        </>
      )}
    </svg>
  </div>
);

// Stats badge component
const StatBadge = ({ icon: Icon, value, label, active }: { icon: any; value: number; label: string; active?: boolean }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
    <Icon className="h-3 w-3" />
    <span className="font-medium">{value}</span>
    <span className="hidden sm:inline">{label}</span>
  </div>
);

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
        <button className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-border transition-all group">
          <PixelFolderIcon color={folder.color} isOpen={isOpen} />
          
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                {folder.name}
              </h3>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {agents.length}件
              </Badge>
            </div>
            
            {/* Folder stats */}
            <div className="flex items-center gap-2 mt-1.5">
              <StatBadge icon={Users} value={agents.length} label="エージェント" />
              <StatBadge icon={Zap} value={activeAgents.length} label="稼働中" active={activeAgents.length > 0} />
              <StatBadge icon={Phone} value={agentsWithPhone.length} label="電話番号" active={agentsWithPhone.length > 0} />
            </div>
          </div>
          
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3 pl-0 sm:pl-4">
          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
              <div className="w-12 h-12 mb-3 opacity-50">
                <svg viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' as const }}>
                  <rect x="1" y="5" width="14" height="9" fill="currentColor" opacity="0.3" />
                  <rect x="2" y="4" width="5" height="2" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                このフォルダにはエージェントがありません
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2">
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
