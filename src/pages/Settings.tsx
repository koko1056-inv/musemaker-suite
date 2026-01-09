import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building, Key, Bell, CreditCard, ExternalLink, Eye, EyeOff, Check, AlertTriangle, Webhook, Wand2, Loader2, Shield, Settings2, Zap, TrendingUp, Users, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { SlackIntegrationManager } from "@/components/notifications/SlackIntegrationManager";
import { EmailNotificationManager } from "@/components/notifications/EmailNotificationManager";
import { SpeechToText } from "@/components/voice-tools/SpeechToText";
import { VoiceClone } from "@/components/voice-tools/VoiceClone";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import { Slack } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
    isAuthenticated
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
      if (workspace.elevenlabs_api_key) {
        setApiKey("••••••••••••••••");
      }
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
      name: workspaceName
    });
    if (success) {
      setHasChanges(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (apiKey === "••••••••••••••••") return;
    if (apiKey.trim()) {
      const success = await updateElevenLabsApiKey(apiKey);
      if (success) {
        setApiKey("••••••••••••••••");
      }
    }
  };

  const handleSaveTwilioCredentials = async () => {
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 sm:pb-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">設定</h1>
              <p className="text-sm text-muted-foreground">
                ワークスペースの設定と連携機能を管理
              </p>
            </div>
          </div>
          {!isAuthenticated && (
            <Badge variant="outline" className="mt-2 text-xs gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              デモモード - ログインすると保存できます
            </Badge>
          )}
        </div>

        <Tabs defaultValue="workspace" className="space-y-4 sm:space-y-6">
          {/* タブリスト - 改善されたスタイル */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
            <TabsList className="bg-muted/30 border border-border inline-flex sm:flex sm:flex-wrap h-auto gap-1 p-1.5 min-w-max sm:min-w-0 rounded-xl">
              <TabsTrigger 
                value="workspace" 
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Building className="h-4 w-4" />
                <span className="hidden xs:inline">ワークスペース</span>
                <span className="xs:hidden">WS</span>
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Key className="h-4 w-4" />
                API連携
                {(hasApiKey || hasTwilioCredentials) && (
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="voice-tools" 
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Wand2 className="h-4 w-4" />
                音声ツール
              </TabsTrigger>
              <TabsTrigger 
                value="webhooks" 
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Webhook className="h-4 w-4" />
                Webhook
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Bell className="h-4 w-4" />
                連携
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <CreditCard className="h-4 w-4" />
                請求
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            <div className="glass rounded-xl card-shadow overflow-hidden">
              {/* カードヘッダー */}
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">ワークスペース情報</h3>
                      <p className="text-xs text-muted-foreground">基本情報を設定</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Shield className="h-3 w-3" />
                      管理者
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* カードコンテンツ */}
              <div className="p-4 sm:p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="workspace-name" className="text-sm font-medium">
                        ワークスペース名
                      </Label>
                      <Input 
                        id="workspace-name" 
                        value={workspaceName} 
                        onChange={e => setWorkspaceName(e.target.value)} 
                        placeholder="ワークスペース名を入力" 
                        className="h-10 text-sm" 
                        disabled={!isAuthenticated} 
                      />
                    </div>
                    <Button 
                      className="h-10 text-sm" 
                      onClick={handleSaveWorkspace} 
                      disabled={!hasChanges || isSaving || !isAuthenticated}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          変更を保存
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            {/* クイックステータス */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 border ${hasApiKey ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {hasApiKey ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className="text-sm font-medium">ElevenLabs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasApiKey ? '接続済み' : '未接続'}
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${hasTwilioCredentials ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {hasTwilioCredentials ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className="text-sm font-medium">Twilio</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasTwilioCredentials ? '接続済み' : '未接続'}
                </p>
              </div>
            </div>

            {/* ElevenLabs */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                      <span className="text-white font-bold text-lg">XI</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">ElevenLabs</h3>
                      <p className="text-xs text-muted-foreground">
                        高品質な音声合成と音声認識
                      </p>
                    </div>
                  </div>
                  {hasApiKey ? (
                    <Badge className="bg-success/10 text-success gap-1 self-start text-xs border border-success/20">
                      <Check className="h-3 w-3" />
                      接続済み
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="self-start text-xs">未接続</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="elevenlabs-key" className="text-sm font-medium">APIキー</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Input 
                        id="elevenlabs-key" 
                        type={apiKeyVisible ? "text" : "password"} 
                        placeholder="sk-..." 
                        value={apiKey} 
                        onChange={e => setApiKey(e.target.value)} 
                        className="pr-10 h-10 text-sm font-mono" 
                        disabled={!isAuthenticated} 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      >
                        {apiKeyVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSaveApiKey} 
                      className="h-10 text-sm" 
                      disabled={isSaving || !isAuthenticated || apiKey === "••••••••••••••••"}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    APIキーは暗号化されて安全に保存されます
                  </p>
                </div>

                <Button variant="outline" className="gap-2 text-sm h-10" asChild>
                  <a href="https://elevenlabs.io/api" target="_blank" rel="noopener noreferrer">
                    APIキーを取得
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Twilio Integration */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shrink-0 shadow-lg">
                      <span className="text-white font-bold text-lg">TW</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Twilio</h3>
                      <p className="text-xs text-muted-foreground">
                        電話番号連携と通話機能
                      </p>
                    </div>
                  </div>
                  {hasTwilioCredentials ? (
                    <Badge className="bg-success/10 text-success gap-1 self-start text-xs border border-success/20">
                      <Check className="h-3 w-3" />
                      接続済み
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="self-start text-xs">未接続</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio-sid" className="text-sm font-medium">Account SID</Label>
                  <div className="relative">
                    <Input 
                      id="twilio-sid" 
                      type={twilioSidVisible ? "text" : "password"} 
                      placeholder="AC..." 
                      value={twilioAccountSid} 
                      onChange={e => setTwilioAccountSid(e.target.value)} 
                      className="pr-10 h-10 text-sm font-mono" 
                      disabled={!isAuthenticated} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                      onClick={() => setTwilioSidVisible(!twilioSidVisible)}
                    >
                      {twilioSidVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twilio-token" className="text-sm font-medium">Auth Token</Label>
                  <div className="relative">
                    <Input 
                      id="twilio-token" 
                      type={twilioTokenVisible ? "text" : "password"} 
                      placeholder="認証トークンを入力" 
                      value={twilioAuthToken} 
                      onChange={e => setTwilioAuthToken(e.target.value)} 
                      className="pr-10 h-10 text-sm font-mono" 
                      disabled={!isAuthenticated} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                      onClick={() => setTwilioTokenVisible(!twilioTokenVisible)}
                    >
                      {twilioTokenVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    認証情報は暗号化されて安全に保存されます
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleSaveTwilioCredentials} 
                    className="h-10 text-sm" 
                    disabled={isSaving || !isAuthenticated || (twilioAccountSid === "••••••••••••••••" && twilioAuthToken === "••••••••••••••••") || !twilioAccountSid.trim() || !twilioAuthToken.trim()}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                  </Button>
                  <Button variant="outline" className="gap-2 text-sm h-10" asChild>
                    <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                      Twilioコンソール
                      <ExternalLink className="h-4 w-4" />
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
          <TabsContent value="notifications" className="space-y-6 sm:space-y-8 pb-24 sm:pb-6">
            {/* Slack連携 */}
            <SlackIntegrationManager workspaceId={workspaceId} />
            
            {/* メール通知 */}
            <EmailNotificationManager workspaceId={workspaceId} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            {/* プラン情報 */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">現在のプラン</h3>
                      <p className="text-sm text-muted-foreground">
                        {workspace?.plan === "pro" ? "Pro" : workspace?.plan === "enterprise" ? "Enterprise" : "Free"}プランをご利用中
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-base px-4 py-1.5 self-start sm:self-auto capitalize font-semibold">
                    {workspace?.plan || "Free"}
                  </Badge>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-3 grid-cols-1 xs:grid-cols-3 mb-6">
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">API呼び出し / 月</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">10,000</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">チームメンバー</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">5</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">エージェント</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">無制限</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="h-10 text-sm gap-2">
                    <Zap className="h-4 w-4" />
                    プランをアップグレード
                  </Button>
                  <Button variant="outline" className="h-10 text-sm">
                    請求を管理
                  </Button>
                </div>
              </div>
            </div>

            {/* 使用量 */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">今月の使用量</h3>
                    <p className="text-xs text-muted-foreground">リアルタイムの使用状況</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">API呼び出し</span>
                    <span className="font-medium text-foreground">6,234 / 10,000</span>
                  </div>
                  <Progress value={62.34} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">残り 3,766 回</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">音声分数</span>
                    <span className="font-medium text-foreground">1,450 / 5,000</span>
                  </div>
                  <Progress value={29} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">残り 3,550 分</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
