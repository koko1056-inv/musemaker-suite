import { useState } from "react";
import { useWebhooks, useWebhookLogs } from "@/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, History, Globe, Slack, HelpCircle, CheckCircle2, ArrowRight, Copy, Check, MessageSquare, Zap } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface WebhookManagerProps {
  workspaceId: string;
}

export function WebhookManager({ workspaceId }: WebhookManagerProps) {
  const { webhooks, isLoading, createWebhook, deleteWebhook, toggleWebhook } = useWebhooks(workspaceId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", headers: "" });
  const [copiedPayload, setCopiedPayload] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    let headers = {};
    if (newWebhook.headers.trim()) {
      try {
        headers = JSON.parse(newWebhook.headers);
      } catch {
        toast({
          title: "エラー",
          description: "ヘッダーのJSON形式が正しくありません",
          variant: "destructive",
        });
        return;
      }
    }

    await createWebhook.mutateAsync({
      name: newWebhook.name,
      url: newWebhook.url,
      headers,
    });
    setNewWebhook({ name: "", url: "", headers: "" });
    setIsCreateOpen(false);
  };

  const getWebhookIcon = (url: string) => {
    if (url.includes("slack")) return <Slack className="h-5 w-5 text-[#4A154B]" />;
    if (url.includes("zapier")) return <Zap className="h-5 w-5 text-[#FF4A00]" />;
    return <Globe className="h-5 w-5 text-primary" />;
  };

  const samplePayload = `{
  "event_type": "conversation_ended",
  "conversation_id": "uuid",
  "agent_id": "uuid",
  "agent_name": "カスタマーサポート",
  "phone_number": "+81-xxx-xxxx",
  "duration_seconds": 180,
  "outcome": "resolved",
  "transcript": [...],
  "timestamp": "2026-01-03T12:00:00Z"
}`;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(samplePayload);
    setCopiedPayload(true);
    toast({ title: "コピーしました" });
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 説明セクション */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Webhookとは？</h3>
              <p className="text-muted-foreground mb-4">
                通話が終わったとき、自動的に他のサービスへ通知を送る機能です。<br />
                例えば、SlackやLINE、CRMシステムへ「通話が終わりました」という情報を送れます。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">1</div>
                  <span className="text-sm">通話が終了</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">2</div>
                  <span className="text-sm">自動で通知送信</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">3</div>
                  <span className="text-sm">Slack等で確認</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ヘッダーと追加ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            登録済みWebhook
            <Badge variant="secondary" className="ml-2">{webhooks.length}件</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            通話終了時に通知を受け取るサービスを登録
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              新しいWebhookを追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">新しいWebhookを追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              {/* ステップ1: 名前 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                  <Label className="text-base font-medium">分かりやすい名前をつける</Label>
                </div>
                <Input
                  placeholder="例: Slack通知、営業チーム連絡"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">どこに通知を送るか分かる名前をつけましょう</p>
              </div>

              {/* ステップ2: URL */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                  <Label className="text-base font-medium">Webhook URLを入力</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Slackの場合: Incoming Webhooksアプリを追加してURLを取得</p>
                        <p className="mt-1">Zapierの場合: Zapの「Webhooks by Zapier」トリガーからURLを取得</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="h-12 text-base font-mono text-sm"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Slack className="h-3 w-3 mr-1" />
                    Slack対応
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Zapier対応
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    その他のサービス
                  </Badge>
                </div>
              </div>

              {/* ステップ3: ヘッダー（オプション） */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
                  <Label className="text-base font-medium text-muted-foreground">ヘッダー（任意・上級者向け）</Label>
                </div>
                <Textarea
                  placeholder='例: {"Authorization": "Bearer あなたのトークン"}'
                  value={newWebhook.headers}
                  onChange={(e) => setNewWebhook({ ...newWebhook, headers: e.target.value })}
                  rows={2}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">通常は空欄でOK。認証が必要な場合のみ入力してください</p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newWebhook.name || !newWebhook.url || createWebhook.isPending}
                className="w-full h-12 text-base"
              >
                {createWebhook.isPending ? "作成中..." : "Webhookを作成する"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhookリスト */}
      {webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Globe className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Webhookが未登録です</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              「新しいWebhookを追加」ボタンから、<br />
              通知を受け取りたいサービスを登録しましょう
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Slack className="h-4 w-4 mr-1" />
                Slack
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Zap className="h-4 w-4 mr-1" />
                Zapier
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Globe className="h-4 w-4 mr-1" />
                その他
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                  {/* 左側: アイコンと情報 */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2.5 bg-muted rounded-lg shrink-0">
                      {getWebhookIcon(webhook.url)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-base">{webhook.name}</h4>
                        <Badge 
                          variant={webhook.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {webhook.is_active ? "✓ 有効" : "無効"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1 max-w-md">
                        {webhook.url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        イベント: 通話終了時
                      </p>
                    </div>
                  </div>

                  {/* 右側: コントロール */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {webhook.is_active ? "ON" : "OFF"}
                      </span>
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={(checked) =>
                          toggleWebhook.mutate({ id: webhook.id, is_active: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWebhookId(webhook.id)}
                            className="h-9"
                          >
                            <History className="h-4 w-4 mr-1" />
                            履歴
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <History className="h-5 w-5" />
                              送信履歴 - {webhook.name}
                            </DialogTitle>
                          </DialogHeader>
                          <WebhookLogsTable webhookId={webhook.id} />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWebhook.mutate(webhook.id)}
                        className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ペイロード例 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                送信されるデータの例
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>通話終了時に、このような形式のデータが登録したURLに送信されます</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>通話終了時に送信されるJSON形式のデータ</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyPayload}>
              {copiedPayload ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  コピー
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
            {samplePayload}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookLogsTable({ webhookId }: { webhookId: string }) {
  const { data: logs, isLoading } = useWebhookLogs(webhookId);

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center">読み込み中...</div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">まだ送信履歴がありません</p>
        <p className="text-sm text-muted-foreground mt-1">通話が終了すると、ここに履歴が表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>最新50件の送信履歴</span>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">日時</TableHead>
              <TableHead className="font-semibold">ステータス</TableHead>
              <TableHead className="font-semibold">詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {format(new Date(log.sent_at), "yyyy/MM/dd HH:mm:ss")}
                </TableCell>
                <TableCell>
                  {log.error_message ? (
                    <Badge variant="destructive" className="font-normal">
                      ✕ エラー
                    </Badge>
                  ) : log.status_code && log.status_code >= 200 && log.status_code < 300 ? (
                    <Badge variant="default" className="bg-green-500 font-normal">
                      ✓ 成功 ({log.status_code})
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-normal">
                      {log.status_code || "不明"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs">
                  <span className="block truncate">
                    {log.error_message || log.response_body || "正常に送信されました"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
