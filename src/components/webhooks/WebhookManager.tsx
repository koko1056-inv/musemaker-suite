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
import { Plus, Trash2, History, Globe, Slack } from "lucide-react";
import { format } from "date-fns";

interface WebhookManagerProps {
  workspaceId: string;
}

export function WebhookManager({ workspaceId }: WebhookManagerProps) {
  const { webhooks, isLoading, createWebhook, deleteWebhook, toggleWebhook } = useWebhooks(workspaceId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", headers: "" });

  const handleCreate = async () => {
    let headers = {};
    if (newWebhook.headers.trim()) {
      try {
        headers = JSON.parse(newWebhook.headers);
      } catch {
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
    if (url.includes("slack")) return <Slack className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Webhook連携</h3>
          <p className="text-sm text-muted-foreground">
            通話終了時にCRMやSlackに自動通知を送信できます
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Webhook追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>名前</Label>
                <Input
                  placeholder="Slack通知"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>
              <div>
                <Label>カスタムヘッダー (JSON)</Label>
                <Textarea
                  placeholder='{"Authorization": "Bearer token"}'
                  value={newWebhook.headers}
                  onChange={(e) => setNewWebhook({ ...newWebhook, headers: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newWebhook.name || !newWebhook.url || createWebhook.isPending}
                className="w-full"
              >
                作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Webhookが設定されていません</p>
            <p className="text-sm text-muted-foreground">
              SlackやCRMに通話終了を通知するWebhookを追加してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getWebhookIcon(webhook.url)}
                    <div>
                      <CardTitle className="text-base">{webhook.name}</CardTitle>
                      <CardDescription className="text-xs truncate max-w-md">
                        {webhook.url}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={(checked) =>
                        toggleWebhook.mutate({ id: webhook.id, is_active: checked })
                      }
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedWebhookId(webhook.id)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>送信ログ - {webhook.name}</DialogTitle>
                        </DialogHeader>
                        <WebhookLogsTable webhookId={webhook.id} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook.mutate(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={webhook.is_active ? "default" : "secondary"}>
                    {webhook.is_active ? "有効" : "無効"}
                  </Badge>
                  <Badge variant="outline">{webhook.event_type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhookペイロード例</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`{
  "event_type": "conversation_ended",
  "conversation_id": "uuid",
  "agent_id": "uuid",
  "agent_name": "カスタマーサポート",
  "phone_number": "+81-xxx-xxxx",
  "duration_seconds": 180,
  "outcome": "resolved",
  "transcript": [...],
  "timestamp": "2026-01-03T12:00:00Z"
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookLogsTable({ webhookId }: { webhookId: string }) {
  const { data: logs, isLoading } = useWebhookLogs(webhookId);

  if (isLoading) {
    return <div className="text-muted-foreground py-4">読み込み中...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="text-muted-foreground py-4">ログがありません</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>日時</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>詳細</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm">
              {format(new Date(log.sent_at), "MM/dd HH:mm:ss")}
            </TableCell>
            <TableCell>
              {log.error_message ? (
                <Badge variant="destructive">エラー</Badge>
              ) : log.status_code && log.status_code >= 200 && log.status_code < 300 ? (
                <Badge variant="default">{log.status_code}</Badge>
              ) : (
                <Badge variant="secondary">{log.status_code || "N/A"}</Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
              {log.error_message || log.response_body || "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
