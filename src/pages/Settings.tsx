import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building, Key, Bell, CreditCard, ExternalLink, Eye, EyeOff, Check, AlertTriangle, Webhook, Wand2, Loader2, Shield, Settings2, Zap, TrendingUp, Users, Bot, ChevronDown, Plus, MoreVertical, UserX, HelpCircle, Calendar, Cloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { SlackIntegrationManager } from "@/components/notifications/SlackIntegrationManager";
import { SpreadsheetIntegrationManager } from "@/components/notifications/SpreadsheetIntegrationManager";
import { EmailNotificationManager } from "@/components/notifications/EmailNotificationManager";
import { GoogleCalendarIntegrationManager } from "@/components/notifications/GoogleCalendarIntegrationManager";
import { SpeechToText } from "@/components/voice-tools/SpeechToText";
import { VoiceClone } from "@/components/voice-tools/VoiceClone";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Slack } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { Progress } from "@/components/ui/progress";
import { GlassIcon } from "@/components/ui/glass-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TAB_OPTIONS = [
  { value: "workspace", label: "ワークスペース", icon: Building },
  { value: "integrations", label: "API連携", icon: Key },
  { value: "voice-tools", label: "音声ツール", icon: Wand2 },
  { value: "webhooks", label: "Webhook", icon: Webhook },
  { value: "notifications", label: "連携", icon: Bell },
  { value: "billing", label: "請求", icon: CreditCard },
  { value: "guide", label: "使い方", icon: HelpCircle, isLink: true, href: "/guide" },
] as const;

// Demo workspace ID for testing when not authenticated
const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export default function Settings() {
  const navigate = useNavigate();
  const {
    workspace,
    isLoading,
    isSaving,
    isAdmin,
    updateWorkspace,
    updateElevenLabsApiKey,
    updateTwilioCredentials,
    updateGoogleCalendarCredentials,
    isAuthenticated
  } = useWorkspace();
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("workspace");
  const [apiKey, setApiKey] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { user } = useAuth();
  const {
    members,
    invitations,
    isLoading: isMembersLoading,
    invite,
    isInviting,
    updateRole,
    isUpdatingRole,
    removeMember,
    isRemovingMember,
    cancelInvitation,
    isCancellingInvitation,
    isAdmin: isMemberAdmin,
  } = useWorkspaceMembers();

  // Twilio credentials state
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioSidVisible, setTwilioSidVisible] = useState(false);
  const [twilioTokenVisible, setTwilioTokenVisible] = useState(false);

  // Google Calendar credentials state
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleClientIdVisible, setGoogleClientIdVisible] = useState(false);
  const [googleClientSecretVisible, setGoogleClientSecretVisible] = useState(false);

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
      if (workspace.google_client_id) {
        setGoogleClientId("••••••••••••••••");
      }
      if (workspace.google_client_secret) {
        setGoogleClientSecret("••••••••••••••••");
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
  const hasGoogleCalendarCredentials = workspace?.google_client_id && workspace?.google_client_secret;

  const handleSaveGoogleCalendarCredentials = async () => {
    if (googleClientId === "••••••••••••••••" && googleClientSecret === "••••••••••••••••") return;
    const clientIdToSave = googleClientId === "••••••••••••••••" ? workspace?.google_client_id || "" : googleClientId;
    const clientSecretToSave = googleClientSecret === "••••••••••••••••" ? workspace?.google_client_secret || "" : googleClientSecret;
    if (clientIdToSave.trim() && clientSecretToSave.trim()) {
      const success = await updateGoogleCalendarCredentials(clientIdToSave, clientSecretToSave);
      if (success) {
        setGoogleClientId("••••••••••••••••");
        setGoogleClientSecret("••••••••••••••••");
      }
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 sm:pb-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GlassIcon icon={Settings2} size="md" variant="muted" />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* モバイル用ドロップダウン */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-background border-border"
                >
                  <span className="flex items-center gap-2">
                    {(() => {
                      const currentTab = TAB_OPTIONS.find(tab => tab.value === activeTab);
                      if (currentTab) {
                        const Icon = currentTab.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4" />
                            {currentTab.label}
                          </>
                        );
                      }
                      return null;
                    })()}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-2rem)] bg-background border-border">
                {TAB_OPTIONS.map((tab) => {
                  const Icon = tab.icon;
                  const isLinkTab = 'isLink' in tab && tab.isLink;
                  return (
                    <DropdownMenuItem
                      key={tab.value}
                      onClick={() => {
                        if (isLinkTab && 'href' in tab) {
                          navigate(tab.href as string);
                        } else {
                          setActiveTab(tab.value);
                        }
                      }}
                      className={`flex items-center gap-2 ${activeTab === tab.value ? 'bg-muted' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      {tab.value === "integrations" && (hasApiKey || hasTwilioCredentials) && (
                        <span className="h-2 w-2 rounded-full bg-success animate-pulse ml-auto" />
                      )}
                      {isLinkTab && (
                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* デスクトップ用タブリスト */}
          <div className="hidden sm:block">
            <TabsList className="bg-muted/30 border border-border flex flex-wrap h-auto gap-1 p-1.5 rounded-xl">
              <TabsTrigger 
                value="workspace" 
                className="gap-2 text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Building className="h-4 w-4" />
                ワークスペース
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className="gap-2 text-sm px-5 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Key className="h-5 w-5" />
                <span className="text-base font-medium">API連携</span>
                {(hasApiKey || hasTwilioCredentials) && (
                  <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="voice-tools" 
                className="gap-2 text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Wand2 className="h-4 w-4" />
                音声ツール
              </TabsTrigger>
              <TabsTrigger 
                value="webhooks" 
                className="gap-2 text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Webhook className="h-4 w-4" />
                Webhook
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="gap-2 text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Bell className="h-4 w-4" />
                連携
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="gap-2 text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <CreditCard className="h-4 w-4" />
                請求
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            {/* ワークスペース情報 */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              {/* カードヘッダー */}
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GlassIcon icon={Building} size="sm" variant="primary" />
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

            {/* メンバー管理セクション */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GlassIcon icon={Users} size="sm" variant="info" />
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">チームメンバー</h3>
                      <p className="text-xs text-muted-foreground">
                        {members.length}人のメンバー
                        {invitations.length > 0 && ` • ${invitations.length}件の保留中の招待`}
                      </p>
                    </div>
                  </div>
                  {isMemberAdmin && (
                    <Button 
                      size="sm" 
                      onClick={() => setInviteDialogOpen(true)}
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      招待
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {isMembersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    メンバーがいません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-foreground/5 text-foreground text-xs">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0.5 shrink-0"
                          >
                            {member.role === "owner" ? "オーナー" : member.role === "admin" ? "管理者" : "メンバー"}
                          </Badge>
                          {isMemberAdmin && member.role !== "owner" && member.user_id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => updateRole({ 
                                    memberId: member.id, 
                                    newRole: member.role === "admin" ? "member" : "admin" 
                                  })}
                                  disabled={isUpdatingRole}
                                >
                                  <Shield className="mr-2 h-3 w-3" />
                                  {member.role === "admin" ? "メンバーに変更" : "管理者に昇格"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => removeMember(member.id)}
                                  disabled={isRemovingMember}
                                >
                                  <UserX className="mr-2 h-3 w-3" />
                                  削除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                    {members.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm text-muted-foreground"
                        onClick={() => window.location.href = "/team"}
                      >
                        他{members.length - 5}人のメンバーを表示
                      </Button>
                    )}
                  </div>
                )}

                {/* 保留中の招待 */}
                {isMemberAdmin && invitations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">保留中の招待</p>
                    <div className="space-y-2">
                      {invitations.slice(0, 3).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-sm"
                        >
                          <span className="text-muted-foreground truncate">{inv.email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => cancelInvitation(inv.id)}
                            disabled={isCancellingInvitation}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            {/* クイックステータス */}
            <div className="grid grid-cols-3 gap-3">
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
              <div className={`rounded-xl p-4 border ${hasGoogleCalendarCredentials ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {hasGoogleCalendarCredentials ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className="text-sm font-medium">Google Cloud</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasGoogleCalendarCredentials ? '接続済み' : '未接続'}
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

            {/* Google Cloud Integration */}
            <div className="glass rounded-xl card-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg">
                      <Cloud className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Google Cloud</h3>
                      <p className="text-xs text-muted-foreground">
                        Google Calendar、Sheets等のAPI連携
                      </p>
                    </div>
                  </div>
                  {hasGoogleCalendarCredentials ? (
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
                  <Label htmlFor="google-client-id" className="text-sm font-medium">Client ID</Label>
                  <div className="relative">
                    <Input 
                      id="google-client-id" 
                      type={googleClientIdVisible ? "text" : "password"} 
                      placeholder="xxxxx.apps.googleusercontent.com" 
                      value={googleClientId} 
                      onChange={e => setGoogleClientId(e.target.value)} 
                      className="pr-10 h-10 text-sm font-mono" 
                      disabled={!isAuthenticated} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                      onClick={() => setGoogleClientIdVisible(!googleClientIdVisible)}
                    >
                      {googleClientIdVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-client-secret" className="text-sm font-medium">Client Secret</Label>
                  <div className="relative">
                    <Input 
                      id="google-client-secret" 
                      type={googleClientSecretVisible ? "text" : "password"} 
                      placeholder="クライアントシークレットを入力" 
                      value={googleClientSecret} 
                      onChange={e => setGoogleClientSecret(e.target.value)} 
                      className="pr-10 h-10 text-sm font-mono" 
                      disabled={!isAuthenticated} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                      onClick={() => setGoogleClientSecretVisible(!googleClientSecretVisible)}
                    >
                      {googleClientSecretVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    認証情報は暗号化されて安全に保存されます
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleSaveGoogleCalendarCredentials} 
                    className="h-10 text-sm" 
                    disabled={isSaving || !isAuthenticated || (googleClientId === "••••••••••••••••" && googleClientSecret === "••••••••••••••••") || !googleClientId.trim() || !googleClientSecret.trim()}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
                  </Button>
                  <Button variant="outline" className="gap-2 text-sm h-10" asChild>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                      Google Cloud Console
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">設定手順：</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Google Cloud Consoleで新しいプロジェクトを作成</li>
                    <li>必要なAPI（Calendar, Sheets等）を有効化</li>
                    <li>OAuth 2.0クライアントIDを作成</li>
                    <li>Client IDとClient Secretをここに入力</li>
                  </ol>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Calendar</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                    </svg>
                    <span className="text-xs text-muted-foreground">Sheets</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                    </svg>
                    <span className="text-xs text-muted-foreground">Drive</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <span className="text-xs text-muted-foreground">Gmail</span>
                  </div>
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
            
            {/* スプレッドシート連携 */}
            <SpreadsheetIntegrationManager workspaceId={workspaceId} />
            
            {/* メール通知 */}
            <EmailNotificationManager workspaceId={workspaceId} />

            {/* Google Calendar連携 */}
            <GoogleCalendarIntegrationManager 
              workspaceId={workspaceId}
              hasGoogleCloudCredentials={!!hasGoogleCalendarCredentials}
              onNavigateToIntegrations={() => setActiveTab("integrations")}
            />

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

        {/* Invite Dialog */}
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onInvite={invite}
          isInviting={isInviting}
        />
      </div>
    </AppLayout>
  );
}
