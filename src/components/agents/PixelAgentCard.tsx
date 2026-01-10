import { Link } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Phone,
  FolderInput,
  Folder,
  Zap,
  Volume2,
} from "lucide-react";

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

interface PixelAgentCardProps {
  agent: Agent;
  index: number;
  phoneNumbers: PhoneNumber[];
  folders: AgentFolder[];
  assignedPhone?: PhoneNumber;
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onMoveToFolder: (agentId: string, folderId: string | null) => void;
}

// Pixel art style status indicator
const PixelStatusIndicator = ({ isActive, isPulsing }: { isActive: boolean; isPulsing: boolean }) => (
  <div className="relative">
    <div 
      className={`w-3 h-3 ${isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
      style={{ 
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
      }}
    />
    {isPulsing && isActive && (
      <div 
        className="absolute inset-0 w-3 h-3 bg-green-500 animate-ping opacity-75"
        style={{ 
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
        }}
      />
    )}
  </div>
);

// Pixel art robot avatar
const PixelRobotAvatar = ({ color, isActive }: { color: string; isActive: boolean }) => (
  <div 
    className={`relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 ${isActive ? 'animate-float' : ''}`}
    style={{ imageRendering: 'pixelated' as const }}
  >
    {/* Robot body - pixel art style */}
    <svg viewBox="0 0 16 16" className="w-full h-full">
      {/* Head */}
      <rect x="3" y="1" width="10" height="8" fill={color} />
      <rect x="4" y="2" width="2" height="2" fill="white" />
      <rect x="10" y="2" width="2" height="2" fill="white" />
      <rect x="5" y="3" width="1" height="1" fill="black" />
      <rect x="11" y="3" width="1" height="1" fill="black" />
      {/* Mouth */}
      <rect x="5" y="6" width="6" height="1" fill={isActive ? "#22c55e" : "#666"} />
      <rect x="6" y="7" width="4" height="1" fill={isActive ? "#22c55e" : "#666"} />
      {/* Antenna */}
      <rect x="7" y="0" width="2" height="1" fill={color} />
      <rect x="7.5" y="-1" width="1" height="1" fill={isActive ? "#22c55e" : "#666"} />
      {/* Body */}
      <rect x="4" y="9" width="8" height="5" fill={color} opacity="0.8" />
      <rect x="5" y="10" width="2" height="2" fill="white" opacity="0.3" />
      <rect x="9" y="10" width="2" height="2" fill="white" opacity="0.3" />
      {/* Arms */}
      <rect x="2" y="10" width="2" height="3" fill={color} opacity="0.6" />
      <rect x="12" y="10" width="2" height="3" fill={color} opacity="0.6" />
      {/* Legs */}
      <rect x="5" y="14" width="2" height="2" fill={color} opacity="0.6" />
      <rect x="9" y="14" width="2" height="2" fill={color} opacity="0.6" />
    </svg>
  </div>
);

export function PixelAgentCard({
  agent,
  index,
  phoneNumbers,
  folders,
  assignedPhone,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder,
}: PixelAgentCardProps) {
  const isPublished = agent.status === "published";
  const isReady = !!agent.elevenlabs_agent_id;
  const hasPhone = !!assignedPhone;

  // Generate color from agent id
  const getAgentColor = (id: string) => {
    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f43f5e', // rose
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#14b8a6', // teal
      '#06b6d4', // cyan
      '#3b82f6', // blue
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const agentColor = getAgentColor(agent.id);

  return (
    <div
      className="group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg animate-fade-in"
      style={{ 
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Status bar at top */}
      <div 
        className={`h-1 w-full transition-colors ${isPublished && isReady ? 'bg-green-500' : isPublished ? 'bg-yellow-500' : 'bg-muted'}`}
      />
      
      <div className="p-4 sm:p-5">
        {/* Header with avatar and status */}
        <div className="flex items-start gap-3 mb-4">
          <Link to={`/agents/${agent.id}`} className="shrink-0">
            <PixelRobotAvatar color={agentColor} isActive={isPublished && isReady} />
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/agents/${agent.id}`}>
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate text-sm sm:text-base">
                    {agent.name}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {agent.description || '説明未設定'}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
          </div>
        </div>

        {/* Status indicators - pixel style */}
        <div className="flex items-center gap-4 mb-4 p-2.5 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <PixelStatusIndicator isActive={isPublished} isPulsing={false} />
            <span className="text-xs text-muted-foreground">
              {isPublished ? '公開中' : '下書き'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PixelStatusIndicator isActive={isReady} isPulsing={isReady && isPublished} />
            <span className="text-xs text-muted-foreground">
              {isReady ? '通話可能' : '準備中'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PixelStatusIndicator isActive={hasPhone} isPulsing={false} />
            <span className="text-xs text-muted-foreground">
              {hasPhone ? '番号割当' : '番号なし'}
            </span>
          </div>
        </div>

        {/* Phone assignment */}
        {phoneNumbers.length > 0 && (
          <div className="mb-4">
            <Select
              value={assignedPhone?.phone_number_sid || "none"}
              onValueChange={(value) => onPhoneAssign(agent.id, value)}
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="電話番号を割り当て">
                    {assignedPhone ? (
                      <span className="font-mono text-xs">{assignedPhone.phone_number}</span>
                    ) : (
                      <span className="text-muted-foreground">電話番号を割り当て</span>
                    )}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">
                  <span className="text-muted-foreground">未割り当て</span>
                </SelectItem>
                {phoneNumbers.map((phone) => (
                  <SelectItem 
                    key={phone.phone_number_sid} 
                    value={phone.phone_number_sid}
                    disabled={phone.agent_id !== null && phone.agent_id !== agent.id}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{phone.phone_number}</span>
                      {phone.label && (
                        <span className="text-muted-foreground text-xs">({phone.label})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quick action button */}
        <Button asChild variant="outline" size="sm" className="w-full gap-2 h-9 text-xs group/btn">
          <Link to={`/agents/${agent.id}`}>
            <Zap className="h-3.5 w-3.5" />
            設定を開く
          </Link>
        </Button>
      </div>
    </div>
  );
}
