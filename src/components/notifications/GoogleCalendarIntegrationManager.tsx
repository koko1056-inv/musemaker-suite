import React, { useState, useCallback } from "react";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCalendarIntegrations, type CalendarIntegration } from "@/hooks/useCalendarIntegrations";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Bell,
  PhoneOff,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Loader2,
  Variable,
  Copy,
  Bot,
  Clock,
  FileText,
  Cloud,
  Key,
  LogOut,
  CheckCircle,
  XCircle,
  RefreshCw,
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

interface GoogleCalendarIntegrationManagerProps {
  workspaceId: string;
  hasGoogleCloudCredentials: boolean;
  onNavigateToIntegrations: () => void;
}

// 利用可能な変数一覧
const AVAILABLE_VARIABLES = [
  { key: "{{agent_name}}", label: "エージェント名", description: "通話を担当したエージェントの名前" },
  { key: "{{phone_number}}", label: "電話番号", description: "相手の電話番号" },
  { key: "{{date}}", label: "日付", description: "通話日（例: 2024/01/15）" },
  { key: "{{time}}", label: "時刻", description: "通話開始時刻（例: 14:30）" },
  { key: "{{datetime}}", label: "日時", description: "通話開始日時（例: 2024/01/15 14:30）" },
  { key: "{{duration}}", label: "通話時間", description: "通話の長さ（例: 5分30秒）" },
  { key: "{{duration_minutes}}", label: "通話時間（分）", description: "通話の長さ（分単位）" },
  { key: "{{outcome}}", label: "結果", description: "通話の結果（例: 完了、失敗）" },
  { key: "{{summary}}", label: "サマリー", description: "通話内容の要約" },
];

export function GoogleCalendarIntegrationManager({ 
  workspaceId, 
  hasGoogleCloudCredentials,
  onNavigateToIntegrations 
}: GoogleCalendarIntegrationManagerProps) {
  const { agents } = useAgents();
  const { toast } = useToast();
  
  const {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    startOAuthFlow,
    listCalendars,
    revokeAuthorization,
    refetch,
  } = useCalendarIntegrations(workspaceId);

  const [calendarOptions, setCalendarOptions] = useState<Record<string, { id: string; name: string; primary?: boolean }[]>>({});
  const [loadingCalendars, setLoadingCalendars] = useState<Record<string, boolean>>({});

  // OAuth成功メッセージを受信
  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'google-calendar-oauth-success') {
        const integrationId = event.data.integration_id;
        refetch();
        toast({ 
          title: "認証完了", 
          description: "Google Calendarとの連携が完了しました。" 
        });
        
        // 自動でカレンダー候補を読み込む
        if (integrationId) {
          setLoadingCalendars(prev => ({ ...prev, [integrationId]: true }));
          try {
            const calendars = await listCalendars(integrationId);
            setCalendarOptions(prev => ({ ...prev, [integrationId]: calendars }));
            // 展開状態にする
            setExpandedId(integrationId);
          } finally {
            setLoadingCalendars(prev => ({ ...prev, [integrationId]: false }));
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch, toast, listCalendars]);

  // 全エージェントの抽出フィールドを取得
  const { data: allExtractionFields = [] } = useQuery({
    queryKey: ["all-extraction-fields-calendar", workspaceId],
    queryFn: async () => {
      if (!agents || agents.length === 0) return [];
      
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agents.map(a => a.id));

      if (error) throw error;
      
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
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [newIntegration, setNewIntegration] = useState({
    name: "",
    calendar_id: "primary",
    create_on_call_end: true,
    create_on_call_failed: false,
    event_title_template: "【通話】{{agent_name}} - {{phone_number}}",
    event_description_template: "📅 日時: {{datetime}}\n📞 電話番号: {{phone_number}}\n⏱️ 通話時間: {{duration}}\n📊 結果: {{outcome}}\n\n{{summary}}",
    event_duration_minutes: 30,
    agent_id: null as string | null,
  });

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedKey(variable);
    toast({ title: "コピーしました" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async () => {
    if (!newIntegration.name) {
      toast({
        title: "入力エラー",
        description: "連携名は必須です",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createIntegration.mutateAsync({
        workspace_id: workspaceId,
        name: newIntegration.name,
        calendar_id: newIntegration.calendar_id || null,
        agent_id: newIntegration.agent_id,
        event_duration_minutes: newIntegration.event_duration_minutes,
        create_on_call_end: newIntegration.create_on_call_end,
        create_on_call_failed: newIntegration.create_on_call_failed,
        event_title_template: newIntegration.event_title_template,
        event_description_template: newIntegration.event_description_template,
        is_active: true,
      });

      setNewIntegration({
        name: "",
        calendar_id: "primary",
        create_on_call_end: true,
        create_on_call_failed: false,
        event_title_template: "【通話】{{agent_name}} - {{phone_number}}",
        event_description_template: "📅 日時: {{datetime}}\n📞 電話番号: {{phone_number}}\n⏱️ 通話時間: {{duration}}\n📊 結果: {{outcome}}\n\n{{summary}}",
        event_duration_minutes: 30,
        agent_id: null,
      });
      setIsCreateOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleIntegration.mutate({ id, isActive: !currentStatus });
  };

  const handleDelete = (id: string) => {
    deleteIntegration.mutate(id);
  };

  const handleUpdateField = (id: string, field: keyof CalendarIntegration, value: unknown) => {
    updateIntegration.mutate({ id, [field]: value });
  };

  const handleAgentChange = (integrationId: string, selectedAgentIds: string[]) => {
    const agentId = selectedAgentIds.length > 0 ? selectedAgentIds[0] : null;
    updateIntegration.mutate({ id: integrationId, agent_id: agentId });
  };

  const handleLoadCalendars = async (integrationId: string) => {
    setLoadingCalendars(prev => ({ ...prev, [integrationId]: true }));
    try {
      const calendars = await listCalendars(integrationId);
      setCalendarOptions(prev => ({ ...prev, [integrationId]: calendars }));
    } finally {
      setLoadingCalendars(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleSelectCalendar = (integrationId: string, calendarId: string) => {
    updateIntegration.mutate({ id: integrationId, calendar_id: calendarId });
  };

  // Google Cloud未接続の場合
  if (!hasGoogleCloudCredentials) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Google Calendar連携</h3>
              <p className="text-sm text-muted-foreground">
                通話終了時にカレンダーへ自動でイベントを作成
              </p>
            </div>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Cloud className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Google Cloudの設定が必要です</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Google Calendar連携を利用するには、<br />
              まずAPI連携タブでGoogle Cloudを設定してください
            </p>
            <Button onClick={onNavigateToIntegrations} className="gap-2">
              <Cloud className="h-4 w-4" />
              Google Cloudを設定
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーと追加ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Google Calendar連携</h3>
            <p className="text-sm text-muted-foreground">
              通話終了時にカレンダーへ自動でイベントを作成
            </p>
          </div>
        </div>
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
                <Calendar className="h-5 w-5 text-green-500" />
                カレンダー連携を追加
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              {/* 基本設定 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">連携名</Label>
                  <Input
                    placeholder="例: 営業通話記録、サポート対応ログ"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">カレンダーID</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>「primary」でメインカレンダーに追加されます。特定のカレンダーに追加する場合はカレンダーIDを入力してください</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    placeholder="primary"
                    value={newIntegration.calendar_id}
                    onChange={(e) => setNewIntegration({ ...newIntegration, calendar_id: e.target.value })}
                    className="h-11 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">イベントの長さ（分）</Label>
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={newIntegration.event_duration_minutes}
                    onChange={(e) => setNewIntegration({ ...newIntegration, event_duration_minutes: parseInt(e.target.value) || 30 })}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">カレンダーに表示されるイベントの長さ</p>
                </div>

                {/* エージェント選択 */}
                <div className="space-y-2">
                  <AgentSelector
                    selectedAgentIds={newIntegration.agent_id ? [newIntegration.agent_id] : null}
                    onChange={(ids) => setNewIntegration({ ...newIntegration, agent_id: ids?.[0] || null })}
                  />
                </div>
              </div>

              {/* イベント設定 */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  作成タイミング
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <PhoneOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">通話終了時</span>
                    </div>
                    <Switch
                      checked={newIntegration.create_on_call_end}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, create_on_call_end: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">通話失敗時</span>
                    </div>
                    <Switch
                      checked={newIntegration.create_on_call_failed}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, create_on_call_failed: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* イベント内容 */}
              <div className="space-y-4 pt-2 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  イベント内容
                </h4>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">タイトルテンプレート</Label>
                  <Input
                    placeholder="【通話】{{agent_name}} - {{phone_number}}"
                    value={newIntegration.event_title_template}
                    onChange={(e) => setNewIntegration({ ...newIntegration, event_title_template: e.target.value })}
                    className="h-11 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">説明テンプレート</Label>
                  <Textarea
                    placeholder="📅 日時: {{datetime}}&#10;📞 電話番号: {{phone_number}}&#10;⏱️ 通話時間: {{duration}}"
                    value={newIntegration.event_description_template}
                    onChange={(e) => setNewIntegration({ ...newIntegration, event_description_template: e.target.value })}
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                {/* 利用可能な変数 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Variable className="h-4 w-4" />
                    利用可能な変数
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <TooltipProvider key={variable.key}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="justify-start gap-2 h-auto py-2 px-3 font-mono text-xs"
                              onClick={() => handleCopyVariable(variable.key)}
                            >
                              {copiedKey === variable.key ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span className="truncate">{variable.label}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{variable.key}</p>
                            <p className="text-xs text-muted-foreground">{variable.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                  
                  {/* 抽出データの変数 */}
                  {allExtractionFields.length > 0 && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground mb-2 block">抽出データ</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {allExtractionFields.map((field) => (
                          <TooltipProvider key={field.field_key}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start gap-2 h-auto py-2 px-3 font-mono text-xs"
                                  onClick={() => handleCopyVariable(`{{${field.field_key}}}`)}
                                >
                                  {copiedKey === `{{${field.field_key}}}` ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  <span className="truncate">{field.field_name}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{`{{${field.field_key}}}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  作成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 連携一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">カレンダー連携がありません</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              通話終了時に自動でカレンダーにイベントを作成できます
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              最初の連携を追加
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="overflow-hidden">
              <Collapsible
                open={expandedId === integration.id}
                onOpenChange={(open) => setExpandedId(open ? integration.id : null)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${integration.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                      <Calendar className={`h-4 w-4 ${integration.is_active ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{integration.name}</h4>
                        <Badge variant={integration.is_active ? "default" : "secondary"} className="shrink-0">
                          {integration.is_active ? "有効" : "無効"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {integration.is_authorized ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            認証済み
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <XCircle className="h-3 w-3" />
                            未認証
                          </span>
                        )}
                        <span>•</span>
                        {integration.agent_id ? (
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {agents?.find(a => a.id === integration.agent_id)?.name || "エージェント"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            すべてのエージェント
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {integration.event_duration_minutes}分
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.is_active}
                      onCheckedChange={() => handleToggle(integration.id, integration.is_active)}
                    />
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon">
                        {expandedId === integration.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                    <div className="pt-4 space-y-4">
                      {/* カレンダー選択（認証済みの場合） */}
                      {integration.is_authorized && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              カレンダーを選択
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={() => handleLoadCalendars(integration.id)}
                              disabled={loadingCalendars[integration.id]}
                            >
                              {loadingCalendars[integration.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              候補を読み込む
                            </Button>
                          </div>
                          {calendarOptions[integration.id] && calendarOptions[integration.id].length > 0 && (
                            <Select
                              value={integration.calendar_id || "primary"}
                              onValueChange={(value) => handleSelectCalendar(integration.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="カレンダーを選択..." />
                              </SelectTrigger>
                              <SelectContent>
                                {calendarOptions[integration.id].map((cal) => (
                                  <SelectItem key={cal.id} value={cal.id}>
                                    {cal.name} {cal.primary && "(メイン)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}

                      {/* 基本設定 */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">カレンダーID（手動入力）</Label>
                          <Input
                            value={integration.calendar_id || "primary"}
                            onChange={(e) => handleUpdateField(integration.id, "calendar_id", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">イベントの長さ（分）</Label>
                          <Input
                            type="number"
                            min={5}
                            max={480}
                            value={integration.event_duration_minutes}
                            onChange={(e) => handleUpdateField(integration.id, "event_duration_minutes", parseInt(e.target.value) || 30)}
                          />
                        </div>
                      </div>

                      {/* Google認証セクション */}
                      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            <Label className="text-sm font-medium">Google Calendar認証</Label>
                          </div>
                          {integration.is_authorized ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              認証済み
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <XCircle className="h-3 w-3 mr-1" />
                              未認証
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {integration.is_authorized 
                            ? "Google Calendarへのアクセスが許可されています。イベントは自動的に作成されます。"
                            : "Google Calendarにイベントを作成するには、Googleアカウントで認証する必要があります。"
                          }
                        </p>
                        <div className="flex gap-2">
                          {integration.is_authorized ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <LogOut className="h-4 w-4" />
                                  認証を解除
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>認証を解除しますか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Google Calendarへのアクセス権限を取り消します。イベントの自動作成は停止されます。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => revokeAuthorization.mutate(integration.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    解除する
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button 
                              onClick={() => startOAuthFlow(integration.id)} 
                              size="sm" 
                              className="gap-2"
                            >
                              <Key className="h-4 w-4" />
                              Googleで認証
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* エージェント選択 */}
                      <div className="space-y-2">
                        <AgentSelector
                          selectedAgentIds={integration.agent_id ? [integration.agent_id] : null}
                          onChange={(ids) => handleAgentChange(integration.id, ids || [])}
                        />
                      </div>

                      {/* 作成タイミング */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">作成タイミング</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <span className="text-sm flex items-center gap-2">
                              <PhoneOff className="h-4 w-4 text-muted-foreground" />
                              通話終了時
                            </span>
                            <Switch
                              checked={integration.create_on_call_end}
                              onCheckedChange={(checked) => handleUpdateField(integration.id, "create_on_call_end", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <span className="text-sm flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                              通話失敗時
                            </span>
                            <Switch
                              checked={integration.create_on_call_failed}
                              onCheckedChange={(checked) => handleUpdateField(integration.id, "create_on_call_failed", checked)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* テンプレート */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">タイトルテンプレート</Label>
                            {editingTitleId === integration.id ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    handleUpdateField(integration.id, "event_title_template", editingTitle);
                                    setEditingTitleId(null);
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setEditingTitleId(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingTitleId(integration.id);
                                  setEditingTitle(integration.event_title_template);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {editingTitleId === integration.id ? (
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="font-mono text-sm"
                            />
                          ) : (
                            <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                              {integration.event_title_template}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">説明テンプレート</Label>
                            {editingDescriptionId === integration.id ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    handleUpdateField(integration.id, "event_description_template", editingDescription);
                                    setEditingDescriptionId(null);
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setEditingDescriptionId(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingDescriptionId(integration.id);
                                  setEditingDescription(integration.event_description_template);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {editingDescriptionId === integration.id ? (
                            <Textarea
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="font-mono text-sm min-h-[120px]"
                            />
                          ) : (
                            <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap">
                              {integration.event_description_template}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 削除ボタン */}
                      <div className="pt-4 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              この連携を削除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>連携を削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{integration.name}」を削除すると、この設定は復元できません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(integration.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}