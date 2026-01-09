import { useState } from "react";
import { useSlackIntegrations } from "@/hooks/useSlackIntegrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  Slack,
  Send,
  ChevronDown,
  ChevronUp,
  Hash,
  Settings2,
  ExternalLink,
  HelpCircle,
  Bell,
  BellOff,
  FileText,
  MessageSquare,
  Phone,
  PhoneOff,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface SlackIntegrationManagerProps {
  workspaceId: string;
}

export function SlackIntegrationManager({ workspaceId }: SlackIntegrationManagerProps) {
  const {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    testWebhook,
  } = useSlackIntegrations(workspaceId);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [editingWebhookUrl, setEditingWebhookUrl] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState("");
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    webhook_url: "",
    channel_name: "",
    notify_on_call_start: false,
    notify_on_call_end: true,
    notify_on_call_failed: true,
    include_transcript: false,
    include_summary: true,
  });
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newIntegration.name || !newIntegration.webhook_url) {
      toast({
        title: "入力エラー",
        description: "名前とWebhook URLは必須です",
        variant: "destructive",
      });
      return;
    }

    await createIntegration.mutateAsync({
      name: newIntegration.name,
      webhook_url: newIntegration.webhook_url,
      channel_name: newIntegration.channel_name || undefined,
      notify_on_call_start: newIntegration.notify_on_call_start,
      notify_on_call_end: newIntegration.notify_on_call_end,
      notify_on_call_failed: newIntegration.notify_on_call_failed,
      include_transcript: newIntegration.include_transcript,
      include_summary: newIntegration.include_summary,
    });

    setNewIntegration({
      name: "",
      webhook_url: "",
      channel_name: "",
      notify_on_call_start: false,
      notify_on_call_end: true,
      notify_on_call_failed: true,
      include_transcript: false,
      include_summary: true,
    });
    setIsCreateOpen(false);
  };

  const handleTestWebhook = async (webhookUrl: string) => {
    await testWebhook(webhookUrl);
  };

  const handleStartEditWebhook = (integration: { id: string; webhook_url: string }) => {
    setEditingWebhookId(integration.id);
    setEditingWebhookUrl(integration.webhook_url);
  };

  const handleSaveWebhookUrl = async (id: string) => {
    if (!editingWebhookUrl) {
      toast({
        title: "エラー",
        description: "Webhook URLを入力してください",
        variant: "destructive",
      });
      return;
    }
    await updateIntegration.mutateAsync({
      id,
      webhook_url: editingWebhookUrl,
    });
    setEditingWebhookId(null);
    setEditingWebhookUrl("");
  };

  const handleCancelEditWebhook = () => {
    setEditingWebhookId(null);
    setEditingWebhookUrl("");
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 説明セクション */}
      <Card className="bg-gradient-to-r from-[#4A154B]/10 to-[#4A154B]/5 border-[#4A154B]/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#4A154B] rounded-xl">
              <Slack className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Slack通知設定</h3>
              <p className="text-muted-foreground mb-4">
                通話の開始・終了・失敗時にSlackチャンネルへ自動で通知を送信できます。<br />
                チームでリアルタイムに通話状況を共有しましょう。
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
            登録済みSlack連携
            <Badge variant="secondary" className="ml-2">{integrations.length}件</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            通知を受け取るSlackチャンネルを設定
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto gap-2">
              <Plus className="h-5 w-5" />
              Slack連携を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Slack className="h-5 w-5 text-[#4A154B]" />
                Slack連携を追加
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              {/* 基本設定 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">連携名</Label>
                  <Input
                    placeholder="例: 営業チーム通知、カスタマーサポート"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Webhook URL</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Slackの「Incoming Webhooks」アプリを追加してURLを取得してください</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={newIntegration.webhook_url}
                    onChange={(e) => setNewIntegration({ ...newIntegration, webhook_url: e.target.value })}
                    className="h-11 font-mono text-sm"
                  />
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
                      Webhook URLの取得方法
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">チャンネル名（任意）</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="general"
                      value={newIntegration.channel_name}
                      onChange={(e) => setNewIntegration({ ...newIntegration, channel_name: e.target.value })}
                      className="h-11 pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">管理用のメモです。実際の送信先はWebhook URLで決まります</p>
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
                      checked={newIntegration.notify_on_call_start}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, notify_on_call_start: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <PhoneOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">通話終了時</span>
                    </div>
                    <Switch
                      checked={newIntegration.notify_on_call_end}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, notify_on_call_end: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">通話失敗時</span>
                    </div>
                    <Switch
                      checked={newIntegration.notify_on_call_failed}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, notify_on_call_failed: checked })
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
                      checked={newIntegration.include_summary}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, include_summary: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">トランスクリプトを含める</span>
                    </div>
                    <Switch
                      checked={newIntegration.include_transcript}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, include_transcript: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newIntegration.name || !newIntegration.webhook_url || createIntegration.isPending}
                className="w-full h-11"
              >
                {createIntegration.isPending ? "作成中..." : "Slack連携を作成"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 連携リスト */}
      {integrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Slack className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Slack連携が未設定です</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              「Slack連携を追加」ボタンから、<br />
              通知を受け取るチャンネルを設定しましょう
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id} className="overflow-hidden">
              <Collapsible
                open={expandedId === integration.id}
                onOpenChange={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                    {/* 左側: アイコンと情報 */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 bg-[#4A154B] rounded-lg shrink-0">
                        <Slack className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-base">{integration.name}</h4>
                          <Badge
                            variant={integration.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {integration.is_active ? "✓ 有効" : "無効"}
                          </Badge>
                        </div>
                        {integration.channel_name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Hash className="h-3.5 w-3.5" />
                            {integration.channel_name}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {integration.notify_on_call_start && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Phone className="h-3 w-3" />
                              開始
                            </Badge>
                          )}
                          {integration.notify_on_call_end && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <PhoneOff className="h-3 w-3" />
                              終了
                            </Badge>
                          )}
                          {integration.notify_on_call_failed && (
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
                          {integration.is_active ? "ON" : "OFF"}
                        </span>
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={(checked) =>
                            toggleIntegration.mutate({ id: integration.id, is_active: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(integration.webhook_url)}
                          className="h-9 gap-1"
                        >
                          <Send className="h-4 w-4" />
                          テスト
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9">
                            {expandedId === integration.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>

                  {/* 展開時の詳細設定 */}
                  <CollapsibleContent>
                    <div className="border-t p-4 sm:p-5 bg-muted/30 space-y-4">
                      {/* Webhook URL編集 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Settings2 className="h-4 w-4" />
                            Webhook URL
                          </Label>
                          {editingWebhookId !== integration.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEditWebhook(integration)}
                              className="h-7 gap-1 text-xs"
                            >
                              <Pencil className="h-3 w-3" />
                              編集
                            </Button>
                          )}
                        </div>
                        {editingWebhookId === integration.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingWebhookUrl}
                              onChange={(e) => setEditingWebhookUrl(e.target.value)}
                              placeholder="https://hooks.slack.com/services/..."
                              className="h-9 font-mono text-sm flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveWebhookUrl(integration.id)}
                              disabled={updateIntegration.isPending}
                              className="h-9 gap-1"
                            >
                              <Check className="h-4 w-4" />
                              保存
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEditWebhook}
                              className="h-9"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground font-mono truncate bg-muted/50 px-3 py-2 rounded-md">
                            {integration.webhook_url.substring(0, 50)}...
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* 通知タイミング */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            通知タイミング
                          </h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">通話開始時</span>
                              <Switch
                                checked={integration.notify_on_call_start}
                                onCheckedChange={(checked) =>
                                  updateIntegration.mutate({
                                    id: integration.id,
                                    notify_on_call_start: checked,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">通話終了時</span>
                              <Switch
                                checked={integration.notify_on_call_end}
                                onCheckedChange={(checked) =>
                                  updateIntegration.mutate({
                                    id: integration.id,
                                    notify_on_call_end: checked,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">通話失敗時</span>
                              <Switch
                                checked={integration.notify_on_call_failed}
                                onCheckedChange={(checked) =>
                                  updateIntegration.mutate({
                                    id: integration.id,
                                    notify_on_call_failed: checked,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 通知内容 */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            通知内容
                          </h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">サマリー</span>
                              <Switch
                                checked={integration.include_summary}
                                onCheckedChange={(checked) =>
                                  updateIntegration.mutate({
                                    id: integration.id,
                                    include_summary: checked,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">トランスクリプト</span>
                              <Switch
                                checked={integration.include_transcript}
                                onCheckedChange={(checked) =>
                                  updateIntegration.mutate({
                                    id: integration.id,
                                    include_transcript: checked,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* カスタムメッセージテンプレート */}
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            カスタムメッセージ
                          </h5>
                          {editingTemplateId !== integration.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTemplateId(integration.id);
                                setEditingTemplate(integration.message_template || "");
                              }}
                              className="h-7 gap-1 text-xs"
                            >
                              <Pencil className="h-3 w-3" />
                              編集
                            </Button>
                          )}
                        </div>
                        
                        {editingTemplateId === integration.id ? (
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
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">抽出データ変数 (エージェントで設定した項目):</p>
                                <p className="text-xs text-muted-foreground">
                                  <code className="bg-violet-100 dark:bg-violet-900/50 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-300">{"{{extracted.フィールドキー}}"}</code>
                                  <span className="ml-2">例: {"{{extracted.customer_name}}"}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await updateIntegration.mutateAsync({
                                    id: integration.id,
                                    message_template: editingTemplate || null,
                                  });
                                  setEditingTemplateId(null);
                                  setEditingTemplate("");
                                }}
                                disabled={updateIntegration.isPending}
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
                              {integration.message_template && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await updateIntegration.mutateAsync({
                                      id: integration.id,
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
                            {integration.message_template ? (
                              <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-mono">
                                {integration.message_template}
                              </pre>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                デフォルトのメッセージ形式を使用します。カスタマイズするには「編集」をクリック。
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 削除ボタン */}
                      <div className="pt-3 border-t flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIntegration.mutate(integration.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          この連携を削除
                        </Button>
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
