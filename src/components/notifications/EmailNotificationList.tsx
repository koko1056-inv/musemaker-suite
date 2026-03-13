import { AgentSelector } from "./AgentSelector";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { EmailNotification } from "@/hooks/useEmailNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Trash2,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Settings2,
  Bell,
  FileText,
  MessageSquare,
  Phone,
  PhoneOff,
  AlertTriangle,
  Pencil,
  Check,
  X,
  AtSign,
  Loader2,
  Bot,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
interface ExtractionField {
  field_key: string;
  field_name: string;
}

interface MutationLike<TVariables> {
  mutate: (variables: TVariables) => void;
}

interface EmailNotificationListProps {
  notifications: EmailNotification[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  editingEmailId: string | null;
  editingEmailValue: string;
  editingTemplateId: string | null;
  editingTemplate: string;
  testingId: string | null;
  filteredExtractionFields: ExtractionField[];
  updateNotificationPending: boolean;
  toggleNotification: MutationLike<{ id: string; is_active: boolean }>;
  updateNotification: MutationLike<Record<string, unknown>>;
  deleteNotification: MutationLike<string>;
  onStartEditEmail: (notification: { id: string; recipient_email: string }) => void;
  onSaveEmail: (id: string) => void;
  onCancelEditEmail: () => void;
  onEditingEmailValueChange: (value: string) => void;
  onStartEditTemplate: (notificationId: string, currentTemplate: string | null) => void;
  onEditingTemplateChange: (value: string) => void;
  onSaveTemplate: (notificationId: string) => void;
  onCancelEditTemplate: () => void;
  onResetTemplate: (notificationId: string) => void;
  onTest: (notification: { id: string; recipient_email: string }) => void;
}

export function EmailNotificationList({
  notifications,
  expandedId,
  setExpandedId,
  editingEmailId,
  editingEmailValue,
  editingTemplateId,
  editingTemplate,
  testingId,
  filteredExtractionFields,
  updateNotificationPending,
  toggleNotification,
  updateNotification,
  deleteNotification,
  onStartEditEmail,
  onSaveEmail,
  onCancelEditEmail,
  onEditingEmailValueChange,
  onStartEditTemplate,
  onEditingTemplateChange,
  onSaveTemplate,
  onCancelEditTemplate,
  onResetTemplate,
  onTest,
}: EmailNotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Mail className="h-10 w-10 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-lg mb-2">メール通知が未設定です</h4>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            「メール通知を追加」ボタンから、<br />
            通知を受け取るメールアドレスを設定しましょう
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card key={notification.id} className="overflow-hidden">
          <Collapsible
            open={expandedId === notification.id}
            onOpenChange={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
          >
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                {/* 左側: アイコンと情報 */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-2.5 bg-blue-500 rounded-lg shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-base">{notification.name}</h4>
                      <Badge
                        variant={notification.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {notification.is_active ? "✓ 有効" : "無効"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <AtSign className="h-3.5 w-3.5" />
                      {notification.recipient_email}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {notification.notify_on_call_start && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Phone className="h-3 w-3" />
                          開始
                        </Badge>
                      )}
                      {notification.notify_on_call_end && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <PhoneOff className="h-3 w-3" />
                          終了
                        </Badge>
                      )}
                      {notification.notify_on_call_failed && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          失敗
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右側: コントロール */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {notification.is_active ? "ON" : "OFF"}
                    </span>
                    <Switch
                      checked={notification.is_active}
                      onCheckedChange={(checked) =>
                        toggleNotification.mutate({ id: notification.id, is_active: checked })
                      }
                    />
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Settings2 className="h-4 w-4" />
                      {expandedId === notification.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent>
                <div className="px-4 sm:px-5 pb-5 pt-2 border-t space-y-5">
                  {/* メールアドレス編集 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">メールアドレス</Label>
                    {editingEmailId === notification.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={editingEmailValue}
                          onChange={(e) => onEditingEmailValueChange(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onSaveEmail(notification.id)}
                          disabled={updateNotificationPending}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={onCancelEditEmail}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md">
                          {notification.recipient_email}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onStartEditEmail(notification)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 通知タイミング */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      通知タイミング
                    </Label>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">通話開始時</span>
                        </div>
                        <Switch
                          checked={notification.notify_on_call_start}
                          onCheckedChange={(checked) =>
                            updateNotification.mutate({
                              id: notification.id,
                              notify_on_call_start: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <PhoneOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">通話終了時</span>
                        </div>
                        <Switch
                          checked={notification.notify_on_call_end}
                          onCheckedChange={(checked) =>
                            updateNotification.mutate({
                              id: notification.id,
                              notify_on_call_end: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">通話失敗時</span>
                        </div>
                        <Switch
                          checked={notification.notify_on_call_failed}
                          onCheckedChange={(checked) =>
                            updateNotification.mutate({
                              id: notification.id,
                              notify_on_call_failed: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 通知内容 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      通知内容
                    </Label>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">サマリーを含める</span>
                        </div>
                        <Switch
                          checked={notification.include_summary}
                          onCheckedChange={(checked) =>
                            updateNotification.mutate({
                              id: notification.id,
                              include_summary: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">トランスクリプトを含める</span>
                        </div>
                        <Switch
                          checked={notification.include_transcript}
                          onCheckedChange={(checked) =>
                            updateNotification.mutate({
                              id: notification.id,
                              include_transcript: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* エージェント選択 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      対象エージェント
                    </Label>
                    <AgentSelector
                      selectedAgentIds={notification.agent_ids}
                      onChange={(agentIds) =>
                        updateNotification.mutate({
                          id: notification.id,
                          agent_ids: agentIds,
                        })
                      }
                    />
                  </div>

                  {/* メッセージテンプレート */}
                  <EmailTemplateEditor
                    notification={notification}
                    isEditing={editingTemplateId === notification.id}
                    editingTemplate={editingTemplate}
                    filteredExtractionFields={filteredExtractionFields}
                    updateNotificationPending={updateNotificationPending}
                    onStartEdit={() => onStartEditTemplate(notification.id, notification.message_template)}
                    onTemplateChange={onEditingTemplateChange}
                    onSave={() => onSaveTemplate(notification.id)}
                    onCancel={onCancelEditTemplate}
                    onReset={() => onResetTemplate(notification.id)}
                  />

                  {/* アクションボタン */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => onTest(notification)}
                      disabled={testingId === notification.id}
                    >
                      {testingId === notification.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      テストメールを送信
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>メール通知を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{notification.name}」を削除すると、このアドレスへの通知は送信されなくなります。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteNotification.mutate(notification.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CollapsibleContent>
            </CardContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
