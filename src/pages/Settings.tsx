import { useState, useEffect } from "react";
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
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Webhook,
  Wand2,
  Loader2,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { SlackIntegrationManager } from "@/components/notifications/SlackIntegrationManager";
import { SpeechToText } from "@/components/voice-tools/SpeechToText";
import { VoiceClone } from "@/components/voice-tools/VoiceClone";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import { Slack } from "lucide-react";

// Demo workspace ID for testing when not authenticated
const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export default function Settings() {
  const {
    workspace,
    isLoading,
    isSaving,
    isAdmin,
    updateWorkspace,
    updateElevenLabsApiKey,
    updateTwilioCredentials,
    isAuthenticated,
  } = useWorkspace();

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Twilio credentials state
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioSidVisible, setTwilioSidVisible] = useState(false);
  const [twilioTokenVisible, setTwilioTokenVisible] = useState(false);

  // Initialize form values when workspace loads
  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
      // If there's an API key saved, show placeholder
      if (workspace.elevenlabs_api_key) {
        setApiKey("••••••••••••••••");
      }
      // If Twilio credentials saved, show placeholder
      if (workspace.twilio_account_sid) {
        setTwilioAccountSid("••••••••••••••••");
      }
      if (workspace.twilio_auth_token) {
        setTwilioAuthToken("••••••••••••••••");
      }
    }
  }, [workspace]);

  // Track changes
  useEffect(() => {
    if (workspace) {
      setHasChanges(workspaceName !== workspace.name);
    }
  }, [workspaceName, workspace]);

  const handleSaveWorkspace = async () => {
    const success = await updateWorkspace({
      name: workspaceName,
    });
    if (success) {
      setHasChanges(false);
    }
  };

  const handleSaveApiKey = async () => {
    // Don't save if it's the placeholder
    if (apiKey === "••••••••••••••••") return;
    
    if (apiKey.trim()) {
      const success = await updateElevenLabsApiKey(apiKey);
      if (success) {
        setApiKey("••••••••••••••••");
      }
    }
  };

  const handleSaveTwilioCredentials = async () => {
    // Don't save if both are placeholders
    if (twilioAccountSid === "••••••••••••••••" && twilioAuthToken === "••••••••••••••••") return;
    
    const sidToSave = twilioAccountSid === "••••••••••••••••" ? workspace?.twilio_account_sid || "" : twilioAccountSid;
    const tokenToSave = twilioAuthToken === "••••••••••••••••" ? workspace?.twilio_auth_token || "" : twilioAuthToken;
    
    if (sidToSave.trim() && tokenToSave.trim()) {
      const success = await updateTwilioCredentials(sidToSave, tokenToSave);
      if (success) {
        setTwilioAccountSid("••••••••••••••••");
        setTwilioAuthToken("••••••••••••••••");
      }
    }
  };

  const workspaceId = workspace?.id || DEMO_WORKSPACE_ID;
  const hasApiKey = workspace?.elevenlabs_api_key || apiKey === "••••••••••••••••";
  const hasTwilioCredentials = workspace?.twilio_account_sid && workspace?.twilio_auth_token;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">設定</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            ワークスペースの設定と連携機能を管理
          </p>
          {!isAuthenticated && (
            <Badge variant="outline" className="mt-2 text-xs">
              デモモード - ログインすると保存できます
            </Badge>
          )}
        </div>

        <Tabs defaultValue="workspace" className="space-y-4 sm:space-y-6">
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
            <TabsList className="bg-muted/50 inline-flex sm:flex sm:flex-wrap h-auto gap-1 p-1 min-w-max sm:min-w-0">
              <TabsTrigger value="workspace" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2">
                <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">ワークスペース</span>
                <span className="xs:hidden">WS</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2">
                <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                連携
              </TabsTrigger>
              <TabsTrigger value="voice-tools" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2">
                <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                音声
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2">
                <Webhook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Webhook
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2">
                <Slack className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Slack
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                請求
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-4 sm:space-y-6">
            <div className="glass rounded-xl card-shadow p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">ワークスペース情報</h3>
                {isAdmin && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    管理者
                  </Badge>
                )}
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="workspace-name" className="text-sm">ワークスペース名</Label>
                    <Input
                      id="workspace-name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="ワークスペース名を入力"
                      className="h-9 sm:h-10 text-sm"
                      disabled={!isAuthenticated}
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 sm:pt-4 border-t border-border">
                <Button
                  className="w-full sm:w-auto text-sm h-9 sm:h-10"
                  onClick={handleSaveWorkspace}
                  disabled={!hasChanges || isSaving || !isAuthenticated}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "変更を保存"
                  )}
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-xl card-shadow p-4 sm:p-6 border-destructive/50">
              <h3 className="font-semibold text-destructive mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                危険な操作
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                ワークスペースと関連するすべてのデータを完全に削除します。
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto text-sm h-9 sm:h-10" disabled={!isAdmin}>
                    ワークスペースを削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base sm:text-lg">ワークスペースを削除</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      この操作は取り消せません。ワークスペース、すべてのエージェント、
                      会話、データが完全に削除されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel className="w-full sm:w-auto">キャンセル</AlertDialogCancel>
                    <AlertDialogAction className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4 sm:space-y-6">
            {/* ElevenLabs */}
            <div className="glass rounded-xl card-shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-base sm:text-lg">XI</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">ElevenLabs</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      音声合成と音声認識
                    </p>
                  </div>
                </div>
                {hasApiKey ? (
                  <Badge className="bg-success/10 text-success gap-1 self-start text-xs">
                    <Check className="h-3 w-3" />
                    接続済み
                  </Badge>
                ) : (
                  <Badge variant="outline" className="self-start text-xs">未接続</Badge>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="elevenlabs-key" className="text-sm">APIキー</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="elevenlabs-key"
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder="ElevenLabsのAPIキーを入力"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10 h-9 sm:h-10 text-sm"
                        disabled={!isAuthenticated}
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
                    <Button
                      onClick={handleSaveApiKey}
                      className="w-full sm:w-auto h-9 sm:h-10 text-sm"
                      disabled={isSaving || !isAuthenticated || apiKey === "••••••••••••••••"}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "保存"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    APIキーは暗号化されて安全に保存されます。
                  </p>
                </div>

                <Button variant="outline" className="gap-2 w-full sm:w-auto text-sm h-9 sm:h-10" asChild>
                  <a href="https://elevenlabs.io/api" target="_blank" rel="noopener noreferrer">
                    APIキーを取得
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Twilio Integration */}
            <div className="glass rounded-xl card-shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-base sm:text-lg">TW</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Twilio</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      電話番号連携と通話機能
                    </p>
                  </div>
                </div>
                {hasTwilioCredentials ? (
                  <Badge className="bg-success/10 text-success gap-1 self-start text-xs">
                    <Check className="h-3 w-3" />
                    接続済み
                  </Badge>
                ) : (
                  <Badge variant="outline" className="self-start text-xs">未接続</Badge>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="twilio-sid" className="text-sm">Account SID</Label>
                  <div className="relative">
                    <Input
                      id="twilio-sid"
                      type={twilioSidVisible ? "text" : "password"}
                      placeholder="TwilioのAccount SIDを入力"
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                      className="pr-10 h-9 sm:h-10 text-sm"
                      disabled={!isAuthenticated}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setTwilioSidVisible(!twilioSidVisible)}
                    >
                      {twilioSidVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="twilio-token" className="text-sm">Auth Token</Label>
                  <div className="relative">
                    <Input
                      id="twilio-token"
                      type={twilioTokenVisible ? "text" : "password"}
                      placeholder="TwilioのAuth Tokenを入力"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      className="pr-10 h-9 sm:h-10 text-sm"
                      disabled={!isAuthenticated}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setTwilioTokenVisible(!twilioTokenVisible)}
                    >
                      {twilioTokenVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    認証情報は暗号化されて安全に保存されます。
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleSaveTwilioCredentials}
                    className="w-full sm:w-auto h-9 sm:h-10 text-sm"
                    disabled={
                      isSaving || 
                      !isAuthenticated || 
                      (twilioAccountSid === "••••••••••••••••" && twilioAuthToken === "••••••••••••••••") ||
                      (!twilioAccountSid.trim() || !twilioAuthToken.trim())
                    }
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "保存"
                    )}
                  </Button>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto text-sm h-9 sm:h-10" asChild>
                    <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                      Twilioコンソール
                      <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Voice Tools Tab */}
          <TabsContent value="voice-tools" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <SpeechToText />
              <VoiceClone />
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="pb-24 sm:pb-6">
            <WebhookManager workspaceId={workspaceId} />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            {/* Slack連携 */}
            <SlackIntegrationManager workspaceId={workspaceId} />
            
            {/* メール通知 */}
            <div className="glass rounded-xl card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-foreground mb-4 sm:mb-6 text-sm sm:text-base">メール通知</h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { id: "new-conversation", label: "新しい会話", description: "新しい会話が開始された際に通知" },
                  { id: "failed-calls", label: "失敗した通話", description: "通話が失敗または転送された際にアラート" },
                  { id: "weekly-report", label: "週次分析レポート", description: "エージェントのパフォーマンスのサマリーを受信" },
                  { id: "team-updates", label: "チームの更新", description: "メンバーがワークスペースに参加または退出した際" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base">{item.label}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.id !== "team-updates"} className="shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            <div className="glass rounded-xl card-shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">現在のプラン</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    現在{workspace?.plan === "pro" ? "Pro" : workspace?.plan === "enterprise" ? "Enterprise" : "Free"}プランをご利用中です
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary text-base sm:text-lg px-3 sm:px-4 py-0.5 sm:py-1 self-start sm:self-auto capitalize">
                  {workspace?.plan || "Free"}
                </Badge>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-3 mb-4 sm:mb-6">
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">10,000</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">API呼び出し / 月</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">5</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">チームメンバー</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">無制限</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">エージェント</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button className="w-full sm:w-auto text-sm h-9 sm:h-10">プランをアップグレード</Button>
                <Button variant="outline" className="w-full sm:w-auto text-sm h-9 sm:h-10">請求を管理</Button>
              </div>
            </div>

            {/* Usage */}
            <div className="glass rounded-xl card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">今月の使用量</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                    <span className="text-muted-foreground">API呼び出し</span>
                    <span className="font-medium text-foreground">6,234 / 10,000</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: "62.34%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                    <span className="text-muted-foreground">音声分数</span>
                    <span className="font-medium text-foreground">1,450 / 5,000</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
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
