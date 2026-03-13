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
  MoreHorizontal,
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
import { getAgentIcon } from "@/components/agents/AgentIconPicker";

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
  custom_icon_url?: string | null;
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

// Kept for potential use elsewhere — not rendered in the card.
// Pixel art style status indicator
export const PixelStatusIndicator = ({ isActive, isPulsing, label }: { isActive: boolean; isPulsing: boolean; label?: string }) => (
  <div
    className="relative"
    aria-label={label ? `${label}: ${isActive ? 'オン' : 'オフ'}` : undefined}
    role="img"
  >
    <div
      className={`w-3.5 h-3.5 ${isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
      style={{
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
      }}
    />
    {isPulsing && isActive && (
      <div
        className="absolute inset-0 w-3.5 h-3.5 bg-green-500 animate-ping opacity-75"
        style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
        }}
      />
    )}
    {label && <span className="sr-only">{label}: {isActive ? 'オン' : 'オフ'}</span>}
  </div>
);

// Kept for potential use elsewhere — not rendered in the card.
// Pixel art robot avatar
export const PixelRobotAvatar = ({ color, isActive }: { color: string; isActive: boolean }) => (
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

// Status badge reflecting the combined agent state
const getStatusBadge = (isPublished: boolean, isReady: boolean, hasPhone: boolean) => {
  if (isPublished && isReady && hasPhone) {
    return (
      <Badge
        aria-label="ステータス: 通話可能"
        className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30 gap-1 px-2 py-0.5 text-xs"
      >
        <PhoneCall className="h-3 w-3" />
        通話可能
      </Badge>
    );
  }

  if (isPublished && isReady) {
    return (
      <Badge
        aria-label="ステータス: 稼働中"
        className="bg-blue-500/20 text-blue-500 border-blue-500/30 hover:bg-blue-500/30 gap-1 px-2 py-0.5 text-xs"
      >
        <Zap className="h-3 w-3" />
        稼働中
      </Badge>
    );
  }

  if (isPublished) {
    return (
      <Badge
        aria-label="ステータス: 準備中"
        className="bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 gap-1 px-2 py-0.5 text-xs"
      >
        <MessageSquare className="h-3 w-3" />
        準備中
      </Badge>
    );
  }

  return (
    <Badge
      aria-label="ステータス: 下書き"
      className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30 gap-1 px-2 py-0.5 text-xs"
    >
      <PhoneOff className="h-3 w-3" />
      下書き
    </Badge>
  );
};

// Derive top-bar color from agent state (same logic as before)
const getTopBarColor = (isPublished: boolean, isReady: boolean) => {
  if (isPublished && isReady) return 'bg-green-500';
  if (isPublished) return 'bg-yellow-500';
  return 'bg-muted';
};

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

  // Generate fallback color from agent id
  const getAgentColor = (id: string) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const agentColor = agent.icon_color || getAgentColor(agent.id);
  const IconComponent = getAgentIcon(agent.icon_name || 'bot');

  return (
    <div
      className="group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 ring-primary/20 animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Colored top bar — h-1 (thinner) */}
      <div className={`h-1 w-full ${getTopBarColor(isPublished, isReady)}`} />

      <div className="p-4">
        {/* Row 1: avatar + name + dropdown */}
        <div className="flex items-center gap-3 mb-2">
          {/* Icon-based avatar — h-10 w-10 circle */}
          <Link to={`/agents/${agent.id}`} className="shrink-0" tabIndex={-1}>
            {agent.custom_icon_url && agent.icon_name === 'custom' ? (
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-background shadow-sm">
                <img
                  src={agent.custom_icon_url}
                  alt={agent.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-background shadow-sm"
                style={{ backgroundColor: `${agentColor}20`, borderColor: agentColor }}
              >
                <IconComponent className="h-5 w-5" style={{ color: agentColor }} />
              </div>
            )}
          </Link>

          {/* Agent name — fills remaining width */}
          <Link to={`/agents/${agent.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate">
              {agent.name}
            </h3>
          </Link>

          {/* Dropdown — always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="メニューを開く"
              >
                <MoreHorizontal className="h-4 w-4" />
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

        {/* Row 2: description — 2-line clamp */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {agent.description || '説明未設定'}
        </p>

        {/* Row 3: status badge + phone number (inline) */}
        <div className="flex items-center gap-2 mb-3">
          {getStatusBadge(isPublished, isReady, hasPhone)}
          {hasPhone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="font-mono truncate">{assignedPhone.phone_number}</span>
            </div>
          )}
        </div>

        {/* Row 4: settings link — subtle, right-aligned */}
        <div className="flex justify-end">
          <Link
            to={`/agents/${agent.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            設定を開く
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
