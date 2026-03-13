import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Settings, Copy, Trash2, ChevronDown, Calendar } from "lucide-react";
import { Agent, AgentFolder, PhoneNumber, getAgentColor } from "./OfficeFloorTypes";

// エージェント詳細ダイアログ
export const AgentDetailDialog = ({
  agent,
  isOpen,
  onClose,
  phoneNumbers,
  folders,
  assignedPhone,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder
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
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  if (!agent) return null;
  const isPublished = agent.status === "published";
  const isReady = !!agent.elevenlabs_agent_id;
  const color = agent.icon_color || getAgentColor(agent.id);

  const systemPromptPreview = agent.system_prompt
    ? agent.system_prompt.slice(0, 100) + (agent.system_prompt.length > 100 ? '...' : '')
    : null;

  const formattedDate = agent.created_at
    ? new Date(agent.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-3">
            {/* アイコンアバター */}
            <div
              className="shrink-0 h-11 w-11 rounded-full flex items-center justify-center border"
              style={{ backgroundColor: `${color}20`, borderColor: color }}
            >
              <svg viewBox="0 0 24 32" className="w-6 h-8" style={{ imageRendering: 'pixelated' }}>
                <rect x="6" y="2" width="12" height="10" fill={color} />
                <rect x="8" y="4" width="3" height="3" fill="white" />
                <rect x="13" y="4" width="3" height="3" fill="white" />
                <rect x="9" y="5" width="1" height="1" fill="black" />
                <rect x="14" y="5" width="1" height="1" fill="black" />
                <rect x="9" y="9" width="6" height="1" fill={isReady ? "#22c55e" : "#666"} />
                <rect x="7" y="12" width="10" height="8" fill={color} opacity="0.85" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base leading-tight">{agent.name}</DialogTitle>
              {agent.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {agent.description}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* スクロール可能な本体 */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          {/* ステータスバッジ */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? '公開中' : '下書き'}
            </Badge>
            <Badge variant={isReady ? "default" : "outline"} className={isReady ? 'bg-green-500' : ''}>
              {isReady ? '通話可能' : '準備中'}
            </Badge>
            {assignedPhone && <Badge variant="outline" className="gap-1">
                <Phone className="w-3 h-3" />
                {assignedPhone.phone_number}
              </Badge>}
            {formattedDate && (
              <span className="text-[11px] text-muted-foreground/50 ml-auto flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>

          {/* システムプロンプトプレビュー */}
          {systemPromptPreview && (
            <div>
              <button
                onClick={() => setIsPromptExpanded(prev => !prev)}
                className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span>システムプロンプト</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPromptExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isPromptExpanded ? (
                <div className="p-3 rounded-md bg-muted/50 border text-xs text-muted-foreground font-mono leading-relaxed overflow-y-auto max-h-28">
                  {agent.system_prompt || systemPromptPreview}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60 truncate font-mono">
                  {systemPromptPreview}
                </p>
              )}
            </div>
          )}

          {/* 電話番号・フォルダ - コンパクトに横並び */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {phoneNumbers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">電話番号</label>
                <Select value={assignedPhone?.phone_number_sid || "none"} onValueChange={value => onPhoneAssign(agent.id, value)}>
                  <SelectTrigger className="bg-background h-9 text-sm">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="none">未割り当て</SelectItem>
                    {phoneNumbers.map(phone => <SelectItem key={phone.phone_number_sid} value={phone.phone_number_sid} disabled={phone.agent_id !== null && phone.agent_id !== agent.id}>
                        {phone.phone_number} {phone.label && `(${phone.label})`}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {folders.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">フォルダ</label>
                <Select value={agent.folder_id || "none"} onValueChange={value => onMoveToFolder(agent.id, value === "none" ? null : value)}>
                  <SelectTrigger className="bg-background h-9 text-sm">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="none">未分類</SelectItem>
                    {folders.map(folder => <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: folder.color }} />
                          {folder.name}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン - 固定フッター */}
        <div className="shrink-0 flex gap-2 pt-4 border-t border-border/50">
          <Button asChild className="flex-1 gap-2">
            <Link to={`/agents/${agent.id}`}>
              <Settings className="w-4 h-4" />
              設定を編集
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => { onDuplicate(agent); onClose(); }} title="複製">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => { onDelete(agent.id); onClose(); }} title="削除">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};
