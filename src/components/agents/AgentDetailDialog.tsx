import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Settings, Copy, Trash2 } from "lucide-react";
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
  if (!agent) return null;
  const isPublished = agent.status === "published";
  const isReady = !!agent.elevenlabs_agent_id;
  const color = agent.icon_color || getAgentColor(agent.id);
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* キャラクターアバター */}
            <div className="relative" style={{
            imageRendering: 'pixelated' as const
          }}>
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
          {assignedPhone && <Badge variant="outline" className="gap-1">
              <Phone className="w-3 h-3" />
              {assignedPhone.phone_number}
            </Badge>}
        </div>

        {/* 電話番号割り当て */}
        {phoneNumbers.length > 0 && <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              電話番号割り当て
            </label>
            <Select value={assignedPhone?.phone_number_sid || "none"} onValueChange={value => onPhoneAssign(agent.id, value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="電話番号を選択" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">未割り当て</SelectItem>
                {phoneNumbers.map(phone => <SelectItem key={phone.phone_number_sid} value={phone.phone_number_sid} disabled={phone.agent_id !== null && phone.agent_id !== agent.id}>
                    {phone.phone_number} {phone.label && `(${phone.label})`}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>}

        {/* フォルダ移動 */}
        {folders.length > 0 && <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              フォルダ（エリア）
            </label>
            <Select value={agent.folder_id || "none"} onValueChange={value => onMoveToFolder(agent.id, value === "none" ? null : value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="フォルダを選択" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">未分類エリア</SelectItem>
                {folders.map(folder => <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{
                  backgroundColor: folder.color
                }} />
                      {folder.name}
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>}

        {/* アクションボタン */}
        <div className="flex flex-col gap-2 mt-6">
          <Button asChild className="w-full gap-2">
            <Link to={`/agents/${agent.id}`}>
              <Settings className="w-4 h-4" />
              設定を編集
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
            onDuplicate(agent);
            onClose();
          }}>
              <Copy className="w-4 h-4" />
              複製
            </Button>
            <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive" onClick={() => {
            onDelete(agent.id);
            onClose();
          }}>
              <Trash2 className="w-4 h-4" />
              削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
