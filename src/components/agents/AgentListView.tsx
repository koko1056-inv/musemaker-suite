import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Phone,
  FolderInput,
  Folder,
  ChevronRight,
  Zap,
  MessageSquare,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
import { getAgentIcon } from "./AgentIconPicker";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  voice_id: string;
  status: "draft" | "published";
  elevenlabs_agent_id: string | null;
  folder_id: string | null;
  icon_name?: string | null;
  icon_color?: string | null;
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

interface AgentListViewProps {
  agents: Agent[];
  phoneNumbers: PhoneNumber[];
  folders: AgentFolder[];
  getAgentPhoneNumber: (agentId: string) => PhoneNumber | undefined;
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onMoveToFolder: (agentId: string, folderId: string | null) => void;
}

// Get status badge based on agent state
const getStatusBadge = (agent: Agent, hasPhone: boolean) => {
  const isPublished = agent.status === "published";
  const isReady = !!agent.elevenlabs_agent_id;

  if (isPublished && isReady && hasPhone) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30 gap-1.5 px-3 py-1 text-xs">
        <PhoneCall className="h-3.5 w-3.5" />
        通話可能
      </Badge>
    );
  }
  
  if (isPublished && isReady) {
    return (
      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 hover:bg-blue-500/30 gap-1.5 px-3 py-1 text-xs">
        <Zap className="h-3.5 w-3.5" />
        稼働中
      </Badge>
    );
  }
  
  if (isPublished) {
    return (
      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 gap-1.5 px-3 py-1 text-xs">
        <MessageSquare className="h-3.5 w-3.5" />
        準備中
      </Badge>
    );
  }
  
  return (
    <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30 gap-1.5 px-3 py-1 text-xs">
      <PhoneOff className="h-3.5 w-3.5" />
      下書き
    </Badge>
  );
};

// Status indicator dot
const StatusDot = ({ isActive, isRinging }: { isActive: boolean; isRinging?: boolean }) => (
  <div className="relative shrink-0">
    <div className={`h-2.5 w-2.5 rounded-full ${
      isActive ? 'bg-emerald-500' : 
      isRinging ? 'bg-blue-500' : 
      'bg-slate-400/50'
    }`} />
    {(isActive || isRinging) && (
      <div className={`absolute inset-0 h-2.5 w-2.5 rounded-full animate-ping opacity-75 ${
        isActive ? 'bg-emerald-500' : 'bg-blue-500'
      }`} />
    )}
  </div>
);

export function AgentListView({
  agents,
  phoneNumbers,
  folders,
  getAgentPhoneNumber,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder,
}: AgentListViewProps) {
  // Generate color from agent id for fallback
  const getAgentColor = (id: string) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        エージェントがありません
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="divide-y divide-border/50">
        {agents.map((agent, index) => {
          const isPublished = agent.status === "published";
          const isReady = !!agent.elevenlabs_agent_id;
          const assignedPhone = getAgentPhoneNumber(agent.id);
          const hasPhone = !!assignedPhone;
          const agentColor = agent.icon_color || getAgentColor(agent.id);
          const IconComponent = getAgentIcon(agent.icon_name || 'Bot');

          return (
            <div
              key={agent.id}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors group animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Status Indicator */}
              <StatusDot isActive={isPublished && isReady && hasPhone} isRinging={isPublished && isReady && !hasPhone} />

              {/* Avatar */}
              <Link to={`/agents/${agent.id}`} className="shrink-0">
                <div 
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center border-2 border-background shadow-md transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${agentColor}20`, borderColor: agentColor }}
                >
                  <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: agentColor }} />
                </div>
              </Link>

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/agents/${agent.id}`} className="block">
                  <h3 
                    className="font-semibold text-sm sm:text-base truncate hover:underline"
                    style={{ color: agentColor }}
                  >
                    {agent.name}
                  </h3>
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  {agent.description || '説明未設定'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:block shrink-0">
                {getStatusBadge(agent, hasPhone)}
              </div>

              {/* Phone Number (if assigned) */}
              {hasPhone && (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-mono">{assignedPhone.phone_number}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem asChild>
                      <Link to={`/agents/${agent.id}`} className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        編集する
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(agent)}>
                      <Copy className="mr-2 h-4 w-4" />
                      コピーを作成
                    </DropdownMenuItem>
                    {folders.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderInput className="mr-2 h-4 w-4" />
                            フォルダに移動
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-popover">
                            {agent.folder_id && (
                              <DropdownMenuItem onClick={() => onMoveToFolder(agent.id, null)}>
                                <Folder className="mr-2 h-4 w-4" />
                                フォルダから削除
                              </DropdownMenuItem>
                            )}
                            {folders.map(folder => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={() => onMoveToFolder(agent.id, folder.id)}
                                disabled={agent.folder_id === folder.id}
                              >
                                <div
                                  className="mr-2 h-3 w-3 rounded-sm"
                                  style={{ backgroundColor: folder.color }}
                                />
                                {folder.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(agent.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除する
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to={`/agents/${agent.id}`}>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
