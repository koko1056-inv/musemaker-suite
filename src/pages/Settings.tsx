import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
import {
  Building,
  Key,
  Bell,
  Shield,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setApiKeySaved(true);
      // In production, this would save to the backend
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">設定</h1>
          <p className="mt-1 text-muted-foreground">
            ワークスペースの設定と連携機能を管理
          </p>
        </div>

        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="workspace" className="gap-2">
              <Building className="h-4 w-4" />
              ワークスペース
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Key className="h-4 w-4" />
              連携
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              通知
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              請求
            </TabsTrigger>
          </TabsList>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-6">
            <div className="glass rounded-xl card-shadow p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">ワークスペース情報</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">ワークスペース名</Label>
                    <Input id="workspace-name" defaultValue="株式会社サンプル" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-slug">ワークスペースURL</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        voiceforge.ai/
                      </span>
                      <Input
                        id="workspace-slug"
                        defaultValue="sample-corp"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button>変更を保存</Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-xl card-shadow p-6 border-destructive/50">
              <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                危険な操作
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ワークスペースと関連するすべてのデータを完全に削除します。
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">ワークスペースを削除</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ワークスペースを削除</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。ワークスペース、すべてのエージェント、
                      会話、データが完全に削除されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            {/* ElevenLabs */}
            <div className="glass rounded-xl card-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">XI</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">ElevenLabs</h3>
                    <p className="text-sm text-muted-foreground">
                      音声合成と音声認識
                    </p>
                  </div>
                </div>
                {apiKeySaved ? (
                  <Badge className="bg-success/10 text-success gap-1">
                    <Check className="h-3 w-3" />
                    接続済み
                  </Badge>
                ) : (
                  <Badge variant="outline">未接続</Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="elevenlabs-key">APIキー</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="elevenlabs-key"
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder="ElevenLabsのAPIキーを入力"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      >
                        {apiKeyVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button onClick={handleSaveApiKey}>保存</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    APIキーは暗号化されて安全に保存されます。
                  </p>
                </div>

                <Button variant="outline" className="gap-2" asChild>
                  <a href="https://elevenlabs.io/api" target="_blank" rel="noopener noreferrer">
                    APIキーを取得
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Webhooks */}
            <div className="glass rounded-xl card-shadow p-6">
              <h3 className="font-semibold text-foreground mb-4">Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ワークスペースでイベントが発生した際にリアルタイムで通知を受け取ります。
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
                <Button>Webhookを追加</Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="glass rounded-xl card-shadow p-6">
              <h3 className="font-semibold text-foreground mb-6">メール通知</h3>
              <div className="space-y-4">
                {[
                  { id: "new-conversation", label: "新しい会話", description: "新しい会話が開始された際に通知" },
                  { id: "failed-calls", label: "失敗した通話", description: "通話が失敗または転送された際にアラート" },
                  { id: "weekly-report", label: "週次分析レポート", description: "エージェントのパフォーマンスのサマリーを受信" },
                  { id: "team-updates", label: "チームの更新", description: "メンバーがワークスペースに参加または退出した際" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.id !== "team-updates"} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="glass rounded-xl card-shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">現在のプラン</h3>
                  <p className="text-sm text-muted-foreground">
                    現在Proプランをご利用中です
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary text-lg px-4 py-1">Pro</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-foreground">10,000</p>
                  <p className="text-sm text-muted-foreground">API呼び出し / 月</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm text-muted-foreground">チームメンバー</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-foreground">無制限</p>
                  <p className="text-sm text-muted-foreground">エージェント</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button>プランをアップグレード</Button>
                <Button variant="outline">請求を管理</Button>
              </div>
            </div>

            {/* Usage */}
            <div className="glass rounded-xl card-shadow p-6">
              <h3 className="font-semibold text-foreground mb-4">今月の使用量</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">API呼び出し</span>
                    <span className="font-medium text-foreground">6,234 / 10,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: "62.34%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">音声分数</span>
                    <span className="font-medium text-foreground">1,450 / 5,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: "29%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
