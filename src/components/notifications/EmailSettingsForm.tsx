import { AgentSelector } from "./AgentSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus,
  Mail,
  Bell,
  HelpCircle,
  FileText,
  MessageSquare,
  Phone,
  PhoneOff,
  AlertTriangle,
  AtSign,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NewNotificationState {
  name: string;
  recipient_email: string;
  notify_on_call_start: boolean;
  notify_on_call_end: boolean;
  notify_on_call_failed: boolean;
  include_summary: boolean;
  include_transcript: boolean;
  agent_ids: string[] | null;
}

interface EmailSettingsFormProps {
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  newNotification: NewNotificationState;
  setNewNotification: (value: NewNotificationState) => void;
  handleCreate: () => void;
  createNotificationPending: boolean;
}

export function EmailSettingsForm({
  isCreateOpen,
  setIsCreateOpen,
  newNotification,
  setNewNotification,
  handleCreate,
  createNotificationPending,
}: EmailSettingsFormProps) {
  return (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            メール通知を追加
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          {/* 基本設定 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">通知名</Label>
              <Input
                placeholder="例: 営業チーム通知、管理者アラート"
                value={newNotification.name}
                onChange={(e) => setNewNotification({ ...newNotification, name: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">メールアドレス</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>通知を受け取るメールアドレスを入力してください</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="notification@example.com"
                  value={newNotification.recipient_email}
                  onChange={(e) => setNewNotification({ ...newNotification, recipient_email: e.target.value })}
                  className="h-11 pl-9"
                />
              </div>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              通知タイミング
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">通話開始時</span>
                </div>
                <Switch
                  checked={newNotification.notify_on_call_start}
                  onCheckedChange={(checked) =>
                    setNewNotification({ ...newNotification, notify_on_call_start: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <PhoneOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">通話終了時</span>
                </div>
                <Switch
                  checked={newNotification.notify_on_call_end}
                  onCheckedChange={(checked) =>
                    setNewNotification({ ...newNotification, notify_on_call_end: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">通話失敗時</span>
                </div>
                <Switch
                  checked={newNotification.notify_on_call_failed}
                  onCheckedChange={(checked) =>
                    setNewNotification({ ...newNotification, notify_on_call_failed: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* 通知内容 */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              通知内容
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">サマリーを含める</span>
                </div>
                <Switch
                  checked={newNotification.include_summary}
                  onCheckedChange={(checked) =>
                    setNewNotification({ ...newNotification, include_summary: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">トランスクリプトを含める</span>
                </div>
                <Switch
                  checked={newNotification.include_transcript}
                  onCheckedChange={(checked) =>
                    setNewNotification({ ...newNotification, include_transcript: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* エージェント選択 */}
          <div className="pt-2 border-t">
            <AgentSelector
              selectedAgentIds={newNotification.agent_ids}
              onChange={(agentIds) => setNewNotification({ ...newNotification, agent_ids: agentIds })}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!newNotification.name || !newNotification.recipient_email || createNotificationPending}
            className="w-full h-11"
          >
            {createNotificationPending ? "作成中..." : "メール通知を作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
