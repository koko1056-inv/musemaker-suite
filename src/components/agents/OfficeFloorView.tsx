import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Edit,
  Phone,
  Settings,
  Users,
  Plus,
  Folder,
  FolderInput,
  Copy,
  Trash2,
  Building2,
  Zap,
  MoreVertical,
  X,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string | null;
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

interface OfficeFloorViewProps {
  agents: Agent[];
  folders: AgentFolder[];
  phoneNumbers: PhoneNumber[];
  getAgentPhoneNumber: (agentId: string) => PhoneNumber | undefined;
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onMoveToFolder: (agentId: string, folderId: string | null) => void;
}

// タイピングアニメーション（モニター用）
const TypingAnimation = () => (
  <g className="animate-typing">
    <rect x="15" y="-3" width="2" height="1" fill="#333" />
    <rect x="18" y="-3" width="3" height="1" fill="#333" />
    <rect x="22" y="-3" width="1" height="1" fill="#333" />
    <rect x="15" y="-1.5" width="4" height="1" fill="#333" />
    <rect x="20" y="-1.5" width="2" height="1" fill="#333" />
  </g>
);

// 吹き出し（会話中表示）
const SpeechBubble = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-float">
      <div className="relative bg-white rounded-lg px-2 py-1 shadow-md border border-border">
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-[typing_0.5s_ease-in-out_infinite]" />
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-[typing_0.5s_ease-in-out_0.15s_infinite]" />
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-[typing_0.5s_ease-in-out_0.3s_infinite]" />
        </div>
        {/* 吹き出しの尾 */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-border rotate-45" />
      </div>
    </div>
  );
};

// ピクセルアート風キャラクター
const PixelCharacter = ({ 
  agent, 
  isActive, 
  onClick 
}: { 
  agent: Agent; 
  isActive: boolean;
  onClick: () => void;
}) => {
  const getAgentColor = (id: string) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const color = agent.icon_color || getAgentColor(agent.id);
  
  // アニメーション遅延用のシード
  const animDelay = (agent.id.charCodeAt(0) % 5) * 0.2;
  
  return (
    <button
      onClick={onClick}
      className="relative group cursor-pointer transition-all hover:scale-110 focus:outline-none"
      title={agent.name}
    >
      {/* 会話中吹き出し */}
      <SpeechBubble isActive={isActive} />
      
      {/* キャラクター本体 */}
      <div 
        className={`relative ${isActive ? 'animate-breathing' : ''}`} 
        style={{ 
          imageRendering: 'pixelated' as const,
          animationDelay: `${animDelay}s`,
        }}
      >
        <svg viewBox="0 0 24 32" className="w-8 h-10 sm:w-10 sm:h-12 drop-shadow-md">
          {/* 頭 */}
          <rect x="6" y="2" width="12" height="10" fill={color} />
          {/* 目 - 稼働中は瞬きアニメーション */}
          <rect x="8" y="4" width="3" height="3" fill="white" />
          <rect x="13" y="4" width="3" height="3" fill="white" />
          <rect 
            x="9" y="5" width="1" height="1" fill="black" 
            className={isActive ? "animate-[typing_2s_ease-in-out_infinite]" : ""}
          />
          <rect 
            x="14" y="5" width="1" height="1" fill="black"
            className={isActive ? "animate-[typing_2s_ease-in-out_infinite]" : ""}
          />
          {/* 口 - 稼働中は緑に光って会話アニメーション */}
          <rect 
            x="9" y="9" width="6" height="1" 
            fill={isActive ? "#22c55e" : "#666"} 
            className={isActive ? "animate-[typing_0.3s_ease-in-out_infinite]" : ""}
          />
          {/* アンテナ */}
          <rect x="11" y="0" width="2" height="2" fill={color} />
          <rect 
            x="11.5" y="-1" width="1" height="1" 
            fill={isActive ? "#22c55e" : "#666"} 
            className={isActive ? "animate-headset-glow" : ""}
          />
          {/* 体 */}
          <rect x="7" y="12" width="10" height="8" fill={color} opacity="0.85" />
          <rect x="8" y="14" width="3" height="2" fill="white" opacity="0.3" />
          <rect x="13" y="14" width="3" height="2" fill="white" opacity="0.3" />
          {/* 腕 - 稼働中はタイピングアニメーション */}
          <g className={isActive ? "animate-arm-typing" : ""}>
            <rect x="4" y="13" width="3" height="6" fill={color} opacity="0.7" />
          </g>
          <g className={isActive ? "animate-arm-typing" : ""} style={{ animationDelay: '0.15s' }}>
            <rect x="17" y="13" width="3" height="6" fill={color} opacity="0.7" />
          </g>
          {/* 脚 */}
          <rect x="8" y="20" width="3" height="4" fill={color} opacity="0.7" />
          <rect x="13" y="20" width="3" height="4" fill={color} opacity="0.7" />
          {/* ヘッドセット */}
          <rect x="5" y="5" width="2" height="4" fill="#333" />
          <rect x="17" y="5" width="2" height="4" fill="#333" />
          <rect 
            x="4" y="7" width="2" height="3" 
            fill={isActive ? "#22c55e" : "#666"} 
            className={isActive ? "animate-headset-glow" : ""}
          />
        </svg>
        
        {/* 稼働中インジケーター */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-background" />
        )}
      </div>
      
      {/* 名前タグ */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-[10px] px-1.5 py-0.5 rounded text-foreground font-medium shadow-sm border ${
          isActive ? 'bg-green-500/10 border-green-500/30 text-green-700' : 'bg-background/90 border-border'
        }`}>
          {agent.name.length > 6 ? agent.name.slice(0, 6) + '...' : agent.name}
        </span>
      </div>
    </button>
  );
};

// デスク（座席）コンポーネント
const Desk = ({ 
  hasAgent, 
  agent, 
  isActive,
  onClick,
  onAddAgent,
  folderId,
}: { 
  hasAgent: boolean;
  agent?: Agent;
  isActive: boolean;
  onClick?: () => void;
  onAddAgent?: () => void;
  folderId?: string;
}) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* エージェントキャラクター */}
      <div className="h-14 flex items-end justify-center">
        {hasAgent && agent ? (
          <PixelCharacter agent={agent} isActive={isActive} onClick={onClick!} />
        ) : (
          <button
            onClick={onAddAgent}
            className="w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity rounded border-2 border-dashed border-muted-foreground/50 hover:border-primary"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* デスク */}
      <div className="mt-2" style={{ imageRendering: 'pixelated' as const }}>
        <svg viewBox="0 0 40 20" className="w-12 h-6 sm:w-14 sm:h-7">
          {/* デスク天板 */}
          <rect x="2" y="0" width="36" height="8" fill="#8B7355" />
          <rect x="4" y="2" width="32" height="4" fill="#A08060" />
          {/* モニター */}
          <rect x="12" y="-6" width="16" height="10" fill="#333" />
          <rect 
            x="14" y="-4" width="12" height="6" 
            fill={hasAgent && isActive ? "#a8e6cf" : "#555"} 
            className={hasAgent && isActive ? "animate-screen-flicker" : ""}
          />
          {/* モニター内のテキスト/タイピングアニメーション */}
          {hasAgent && isActive && (
            <g className="animate-typing">
              <rect x="15" y="-3" width="2" height="0.8" fill="#333" />
              <rect x="18" y="-3" width="3" height="0.8" fill="#333" />
              <rect x="22" y="-3" width="1" height="0.8" fill="#333" />
              <rect x="15" y="-1.5" width="4" height="0.8" fill="#333" />
              <rect x="20" y="-1.5" width="2" height="0.8" fill="#333" />
            </g>
          )}
          <rect x="17" y="4" width="6" height="2" fill="#333" />
          {/* キーボード - 稼働中はキーが光る */}
          <rect x="14" y="3" width="12" height="3" fill="#444" />
          {hasAgent && isActive && (
            <g>
              <rect x="15" y="3.5" width="1.5" height="1" fill="#666" className="animate-[typing_0.2s_ease-in-out_infinite]" />
              <rect x="17.5" y="3.5" width="1.5" height="1" fill="#666" className="animate-[typing_0.2s_ease-in-out_0.1s_infinite]" />
              <rect x="20" y="3.5" width="1.5" height="1" fill="#666" className="animate-[typing_0.2s_ease-in-out_0.2s_infinite]" />
              <rect x="22.5" y="3.5" width="1.5" height="1" fill="#666" className="animate-[typing_0.2s_ease-in-out_0.15s_infinite]" />
            </g>
          )}
          {/* デスク脚 */}
          <rect x="4" y="8" width="4" height="10" fill="#6B5344" />
          <rect x="32" y="8" width="4" height="10" fill="#6B5344" />
        </svg>
      </div>
    </div>
  );
};

// オフィスエリア（フォルダ対応）
const OfficeArea = ({
  folder,
  agents,
  maxDesks = 6,
  onAgentClick,
  onAddAgent,
  phoneNumbers,
}: {
  folder?: AgentFolder;
  agents: Agent[];
  maxDesks?: number;
  onAgentClick: (agent: Agent) => void;
  onAddAgent: (folderId: string | null) => void;
  phoneNumbers: PhoneNumber[];
}) => {
  const areaColor = folder?.color || '#64748b';
  const areaName = folder?.name || '未分類エリア';
  
  // デスクの数（最低でもmaxDesksまで表示）
  const desks = [...agents];
  while (desks.length < maxDesks) {
    desks.push(null as any);
  }
  
  return (
    <div 
      className="relative p-4 rounded-xl border-2 transition-all hover:shadow-lg"
      style={{ 
        borderColor: areaColor,
        background: `linear-gradient(135deg, ${areaColor}10, ${areaColor}05)`,
      }}
    >
      {/* エリア名ラベル */}
      <div 
        className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
        style={{ backgroundColor: areaColor }}
      >
        <div className="flex items-center gap-1.5">
          <Folder className="w-3 h-3" />
          {areaName}
        </div>
      </div>
      
      {/* 統計 */}
      <div className="absolute -top-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-background border shadow-sm">
        <span className="text-foreground">{agents.length}</span>
        <span className="text-muted-foreground">/{maxDesks}</span>
      </div>
      
      {/* デスク配置グリッド */}
      <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-8 justify-items-center">
        {desks.slice(0, maxDesks).map((agent, idx) => {
          const hasAgent = agent !== null;
          const isActive = hasAgent && agent.status === 'published' && !!agent.elevenlabs_agent_id;
          const hasPhone = hasAgent && phoneNumbers.some(p => p.agent_id === agent?.id);
          
          return (
            <Desk
              key={hasAgent ? agent.id : `empty-${idx}`}
              hasAgent={hasAgent}
              agent={agent}
              isActive={isActive}
              onClick={hasAgent ? () => onAgentClick(agent) : undefined}
              onAddAgent={() => onAddAgent(folder?.id || null)}
              folderId={folder?.id}
            />
          );
        })}
      </div>
    </div>
  );
};

// エージェント詳細ダイアログ
const AgentDetailDialog = ({
  agent,
  isOpen,
  onClose,
  phoneNumbers,
  folders,
  assignedPhone,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder,
}: {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  phoneNumbers: PhoneNumber[];
  folders: AgentFolder[];
  assignedPhone?: PhoneNumber;
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onMoveToFolder: (agentId: string, folderId: string | null) => void;
}) => {
  if (!agent) return null;
  
  const isPublished = agent.status === "published";
  const isReady = !!agent.elevenlabs_agent_id;
  
  const getAgentColor = (id: string) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const color = agent.icon_color || getAgentColor(agent.id);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* キャラクターアバター */}
            <div className="relative" style={{ imageRendering: 'pixelated' as const }}>
              <svg viewBox="0 0 24 32" className="w-12 h-16">
                <rect x="6" y="2" width="12" height="10" fill={color} />
                <rect x="8" y="4" width="3" height="3" fill="white" />
                <rect x="13" y="4" width="3" height="3" fill="white" />
                <rect x="9" y="5" width="1" height="1" fill="black" />
                <rect x="14" y="5" width="1" height="1" fill="black" />
                <rect x="9" y="9" width="6" height="1" fill={isReady ? "#22c55e" : "#666"} />
                <rect x="11" y="0" width="2" height="2" fill={color} />
                <rect x="7" y="12" width="10" height="8" fill={color} opacity="0.85" />
                <rect x="4" y="13" width="3" height="6" fill={color} opacity="0.7" />
                <rect x="17" y="13" width="3" height="6" fill={color} opacity="0.7" />
                <rect x="8" y="20" width="3" height="4" fill={color} opacity="0.7" />
                <rect x="13" y="20" width="3" height="4" fill={color} opacity="0.7" />
                <rect x="5" y="5" width="2" height="4" fill="#333" />
                <rect x="17" y="5" width="2" height="4" fill="#333" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">{agent.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {agent.description || '説明未設定'}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        {/* ステータスバッジ */}
        <div className="flex items-center gap-2 mt-4">
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? '公開中' : '下書き'}
          </Badge>
          <Badge variant={isReady ? "default" : "outline"} className={isReady ? 'bg-green-500' : ''}>
            {isReady ? '通話可能' : '準備中'}
          </Badge>
          {assignedPhone && (
            <Badge variant="outline" className="gap-1">
              <Phone className="w-3 h-3" />
              {assignedPhone.phone_number}
            </Badge>
          )}
        </div>
        
        {/* 電話番号割り当て */}
        {phoneNumbers.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              電話番号割り当て
            </label>
            <Select
              value={assignedPhone?.phone_number_sid || "none"}
              onValueChange={(value) => onPhoneAssign(agent.id, value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="電話番号を選択" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">未割り当て</SelectItem>
                {phoneNumbers.map((phone) => (
                  <SelectItem 
                    key={phone.phone_number_sid} 
                    value={phone.phone_number_sid}
                    disabled={phone.agent_id !== null && phone.agent_id !== agent.id}
                  >
                    {phone.phone_number} {phone.label && `(${phone.label})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* フォルダ移動 */}
        {folders.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              フォルダ（エリア）
            </label>
            <Select
              value={agent.folder_id || "none"}
              onValueChange={(value) => onMoveToFolder(agent.id, value === "none" ? null : value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="フォルダを選択" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">未分類エリア</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* アクションボタン */}
        <div className="flex flex-col gap-2 mt-6">
          <Button asChild className="w-full gap-2">
            <Link to={`/agents/${agent.id}`}>
              <Settings className="w-4 h-4" />
              設定を編集
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => {
                onDuplicate(agent);
                onClose();
              }}
            >
              <Copy className="w-4 h-4" />
              複製
            </Button>
            <Button 
              variant="outline"
              className="flex-1 gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(agent.id);
                onClose();
              }}
            >
              <Trash2 className="w-4 h-4" />
              削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function OfficeFloorView({
  agents,
  folders,
  phoneNumbers,
  getAgentPhoneNumber,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder,
}: OfficeFloorViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // フォルダごとにエージェントをグループ化
  const agentsByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = agents.filter(a => a.folder_id === folder.id);
    return acc;
  }, {} as Record<string, Agent[]>);
  
  const agentsWithoutFolder = agents.filter(a => !a.folder_id);
  
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailOpen(true);
  };
  
  const handleAddAgent = (folderId: string | null) => {
    // 新規作成ページへ遷移（フォルダ情報付き）
    window.location.href = folderId ? `/agents/new?folder=${folderId}` : '/agents/new';
  };
  
  // 稼働統計
  const activeCount = agents.filter(a => a.status === 'published' && a.elevenlabs_agent_id).length;
  const assignedPhoneCount = agents.filter(a => phoneNumbers.some(p => p.agent_id === a.id)).length;
  
  return (
    <div className="space-y-6">
      {/* オフィス統計ヘッダー */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">コールセンター</h3>
            <p className="text-sm text-muted-foreground">エージェント配置マップ</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{agents.length}</span>
            <span className="text-muted-foreground">名</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium text-green-600">{activeCount}</span>
            <span className="text-muted-foreground">稼働中</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{assignedPhoneCount}</span>
            <span className="text-muted-foreground">番号割当</span>
          </div>
        </div>
      </div>
      
      {/* オフィスフロア */}
      <div 
        className="relative p-6 rounded-2xl border-2 border-border overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 100%)',
        }}
      >
        {/* 床パターン */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px),
              repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)
            `,
          }}
        />
        
        <div className="relative space-y-6">
          {/* フォルダエリア */}
          {folders.map(folder => (
            <OfficeArea
              key={folder.id}
              folder={folder}
              agents={agentsByFolder[folder.id] || []}
              maxDesks={6}
              onAgentClick={handleAgentClick}
              onAddAgent={handleAddAgent}
              phoneNumbers={phoneNumbers}
            />
          ))}
          
          {/* 未分類エリア */}
          {(agentsWithoutFolder.length > 0 || folders.length === 0) && (
            <OfficeArea
              agents={agentsWithoutFolder}
              maxDesks={6}
              onAgentClick={handleAgentClick}
              onAddAgent={handleAddAgent}
              phoneNumbers={phoneNumbers}
            />
          )}
        </div>
      </div>
      
      {/* 凡例 */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>稼働中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          <span>準備中/下書き</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-dashed border-muted-foreground/50 rounded flex items-center justify-center">
            <Plus className="w-3 h-3" />
          </div>
          <span>空き席</span>
        </div>
      </div>
      
      {/* エージェント詳細ダイアログ */}
      <AgentDetailDialog
        agent={selectedAgent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAgent(null);
        }}
        phoneNumbers={phoneNumbers}
        folders={folders}
        assignedPhone={selectedAgent ? getAgentPhoneNumber(selectedAgent.id) : undefined}
        onPhoneAssign={onPhoneAssign}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onMoveToFolder={onMoveToFolder}
      />
    </div>
  );
}
