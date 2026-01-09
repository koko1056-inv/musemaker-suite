import { useState, useMemo } from "react";
import { useEmailNotifications, EmailNotification } from "@/hooks/useEmailNotifications";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AgentSelector } from "./AgentSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Settings2,
  HelpCircle,
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
  Variable,
  Copy,
  Bot,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
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

interface EmailNotificationManagerProps {
  workspaceId: string;
}

export function EmailNotificationManager({ workspaceId }: EmailNotificationManagerProps) {
  const {
    notifications,
    isLoading,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleNotification,
    testEmail,
  } = useEmailNotifications(workspaceId);

  const { agents } = useAgents();
  
  // 全エージェントの抽出フィールドを取得
  const { data: allExtractionFields = [] } = useQuery({
    queryKey: ["all-extraction-fields-email", workspaceId],
    queryFn: async () => {
      if (!agents || agents.length === 0) return [];
      
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agents.map(a => a.id));

      if (error) throw error;
      
      // field_keyでユニークにする
      const uniqueFields = new Map<string, { field_key: string; field_name: string }>();
      data?.forEach(field => {
        if (!uniqueFields.has(field.field_key)) {
          uniqueFields.set(field.field_key, { field_key: field.field_key, field_name: field.field_name });
        }
      });
      
      return Array.from(uniqueFields.values());
    },
    enabled: !!agents && agents.length > 0,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    name: "",
    recipient_email: "",
    notify_on_call_start: false,
    notify_on_call_end: true,
    notify_on_call_failed: true,
    include_summary: true,
    include_transcript: false,
    agent_ids: null as string[] | null,
  });
  const { toast } = useToast();

  // 選択したエージェントの抽出フィールドを取得（編集中の通知用）
  const agentIdsForFields = useMemo(() => {
    if (editingTemplateId) {
      const notification = notifications.find(n => n.id === editingTemplateId);
      return notification?.agent_ids || (agents?.map(a => a.id) || []);
    }
    return newNotification.agent_ids || (agents?.map(a => a.id) || []);
  }, [editingTemplateId, notifications, newNotification.agent_ids, agents]);

  const { data: filteredExtractionFields = [] } = useQuery({
    queryKey: ["extraction-fields-filtered-email", agentIdsForFields],
    queryFn: async () => {
      if (agentIdsForFields.length === 0) return [];
      
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agentIdsForFields);

      if (error) throw error;
      
      // field_keyでユニークにする
      const uniqueFields = new Map<string, { field_key: string; field_name: string }>();
      data?.forEach(field => {
        if (!uniqueFields.has(field.field_key)) {
          uniqueFields.set(field.field_key, { field_key: field.field_key, field_name: field.field_name });
        }
      });
      
      return Array.from(uniqueFields.values());
    },
    enabled: agentIdsForFields.length > 0,
  });

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedKey(variable);
    toast({ title: "コピーしました" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async () => {
    if (!newNotification.name || !newNotification.recipient_email) {
      toast({
        title: "入力エラー",
        description: "名前とメールアドレスは必須です",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newNotification.recipient_email)) {
      toast({
        title: "入力エラー",
        description: "有効なメールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    await createNotification.mutateAsync(newNotification);

    setNewNotification({
      name: "",
      recipient_email: "",
      notify_on_call_start: false,
      notify_on_call_end: true,
      notify_on_call_failed: true,
      include_summary: true,
      include_transcript: false,
      agent_ids: null,
    });
    setIsCreateOpen(false);
  };

  const handleTest = async (notification: { id: string; recipient_email: string }) => {
    setTestingId(notification.id);
    await testEmail(notification.recipient_email);
    setTestingId(null);
  };

  const handleStartEditEmail = (notification: { id: string; recipient_email: string }) => {
    setEditingEmailId(notification.id);
    setEditingEmailValue(notification.recipient_email);
  };

  const handleSaveEmail = async (id: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingEmailValue)) {
      toast({
        title: "エラー",
        description: "有効なメールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }
    await updateNotification.mutateAsync({
      id,
      recipient_email: editingEmailValue,
    });
    setEditingEmailId(null);
    setEditingEmailValue("");
  };

  const handleCancelEditEmail = () => {
    setEditingEmailId(null);
    setEditingEmailValue("");
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 説明セクション */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">メール通知設定</h3>
              <p className="text-muted-foreground mb-4">
                通話の開始・終了・失敗時にメールで自動通知を受け取れます。<br />
                サマリーやトランスクリプトを含めることもできます。
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Phone className="h-3 w-3" />
                  通話開始
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <PhoneOff className="h-3 w-3" />
                  通話終了
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  通話失敗
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ヘッダーと追加ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            登録済みメール通知
            <Badge variant="secondary" className="ml-2">{notifications.length}件</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            通知を受け取るメールアドレスを設定
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto gap-2">
              <Plus className="h-5 w-5" />
              メール通知を追加
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
                disabled={!newNotification.name || !newNotification.recipient_email || createNotification.isPending}
                className="w-full h-11"
              >
                {createNotification.isPending ? "作成中..." : "メール通知を作成"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 通知リスト */}
      {notifications.length === 0 ? (
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
      ) : (
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
                              onChange={(e) => setEditingEmailValue(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEmail(notification.id)}
                              disabled={updateNotification.isPending}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEditEmail}
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
                              onClick={() => handleStartEditEmail(notification)}
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            メッセージテンプレート
                          </Label>
                          {editingTemplateId !== notification.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTemplateId(notification.id);
                                setEditingTemplate(notification.message_template || "");
                              }}
                              className="h-7 gap-1 text-xs"
                            >
                              <Pencil className="h-3 w-3" />
                              編集
                            </Button>
                          )}
                        </div>
                        
                        {editingTemplateId === notification.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editingTemplate}
                              onChange={(e) => setEditingTemplate(e.target.value)}
                              placeholder="例: 📞 {{agent_name}}で通話がありました&#10;📱 電話番号: {{phone_number}}&#10;⏱ 通話時間: {{duration_formatted}}&#10;&#10;📝 要約:&#10;{{summary}}"
                              className="min-h-[120px] font-mono text-sm"
                            />
                            <div className="bg-muted/50 p-3 rounded-md space-y-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">標準変数:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {["agent_name", "phone_number", "duration_formatted", "duration_seconds", "outcome", "summary", "transcript", "event_type", "timestamp"].map((v) => (
                                    <Badge 
                                      key={v} 
                                      variant="outline" 
                                      className="text-xs font-mono cursor-pointer hover:bg-primary/10"
                                      onClick={() => setEditingTemplate((prev) => prev + `{{${v}}}`)}
                                    >
                                      {`{{${v}}}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {filteredExtractionFields.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Variable className="h-3.5 w-3.5 text-violet-500" />
                                    <p className="text-xs text-muted-foreground">選択中のエージェントの抽出変数:</p>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {filteredExtractionFields.map((field) => (
                                      <Badge 
                                        key={field.field_key} 
                                        variant="outline" 
                                        className="text-xs font-mono cursor-pointer hover:bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300"
                                        onClick={() => setEditingTemplate((prev) => prev + `{{extracted.${field.field_key}}}`)}
                                      >
                                        <span className="opacity-50 mr-0.5">{field.field_name}:</span>
                                        {`{{extracted.${field.field_key}}}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {filteredExtractionFields.length === 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    抽出変数: 選択中のエージェントに抽出フィールドが設定されていません
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await updateNotification.mutateAsync({
                                    id: notification.id,
                                    message_template: editingTemplate || null,
                                  });
                                  setEditingTemplateId(null);
                                  setEditingTemplate("");
                                }}
                                disabled={updateNotification.isPending}
                                className="gap-1"
                              >
                                <Check className="h-4 w-4" />
                                保存
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingTemplateId(null);
                                  setEditingTemplate("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {notification.message_template && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await updateNotification.mutateAsync({
                                      id: notification.id,
                                      message_template: null,
                                    });
                                    setEditingTemplateId(null);
                                    setEditingTemplate("");
                                  }}
                                  className="text-destructive hover:text-destructive ml-auto"
                                >
                                  リセット
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            {notification.message_template ? (
                              <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-mono">
                                {notification.message_template}
                              </pre>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                デフォルトのメール形式を使用します。カスタマイズするには「編集」をクリック。
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleTest(notification)}
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
      )}
    </div>
  );
}
