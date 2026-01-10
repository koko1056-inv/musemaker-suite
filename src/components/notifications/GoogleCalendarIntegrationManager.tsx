import { useState, useMemo } from "react";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings2,
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
  ExternalLink,
  Cloud,
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

interface CalendarIntegration {
  id: string;
  name: string;
  calendar_id: string;
  is_active: boolean;
  create_on_call_end: boolean;
  create_on_call_failed: boolean;
  include_summary: boolean;
  include_transcript: boolean;
  event_title_template: string;
  event_description_template: string;
  event_duration_minutes: number;
  agent_ids: string[] | null;
  created_at: string;
  updated_at: string;
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
  const queryClient = useQueryClient();

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

  // カレンダー連携の取得（ローカルストレージで仮実装 - 実際はDBテーブルを使用）
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [newIntegration, setNewIntegration] = useState({
    name: "",
    calendar_id: "primary",
    create_on_call_end: true,
    create_on_call_failed: false,
    include_summary: true,
    include_transcript: false,
    event_title_template: "【通話】{{agent_name}} - {{phone_number}}",
    event_description_template: "📅 日時: {{datetime}}\n📞 電話番号: {{phone_number}}\n⏱️ 通話時間: {{duration}}\n📊 結果: {{outcome}}\n\n{{summary}}",
    event_duration_minutes: 30,
    agent_ids: null as string[] | null,
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

    const newItem: CalendarIntegration = {
      id: crypto.randomUUID(),
      ...newIntegration,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIntegrations(prev => [...prev, newItem]);
    
    setNewIntegration({
      name: "",
      calendar_id: "primary",
      create_on_call_end: true,
      create_on_call_failed: false,
      include_summary: true,
      include_transcript: false,
      event_title_template: "【通話】{{agent_name}} - {{phone_number}}",
      event_description_template: "📅 日時: {{datetime}}\n📞 電話番号: {{phone_number}}\n⏱️ 通話時間: {{duration}}\n📊 結果: {{outcome}}\n\n{{summary}}",
      event_duration_minutes: 30,
      agent_ids: null,
    });
    setIsCreateOpen(false);
    
    toast({ title: "カレンダー連携を作成しました" });
  };

  const handleToggle = (id: string) => {
    setIntegrations(prev => 
      prev.map(item => 
        item.id === id ? { ...item, is_active: !item.is_active } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setIntegrations(prev => prev.filter(item => item.id !== id));
    toast({ title: "カレンダー連携を削除しました" });
  };

  const handleUpdateIntegration = (id: string, updates: Partial<CalendarIntegration>) => {
    setIntegrations(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      )
    );
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
                                  onClick={() => handleCopyVariable(`{{extract_${field.field_key}}}`)}
                                >
                                  {copiedKey === `{{extract_${field.field_key}}}` ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  <span className="truncate">{field.field_name}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{`{{extract_${field.field_key}}}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 含める内容 */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium">含める内容</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">サマリーを含める</span>
                    <Switch
                      checked={newIntegration.include_summary}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, include_summary: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">トランスクリプトを含める</span>
                    <Switch
                      checked={newIntegration.include_transcript}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, include_transcript: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* エージェント選択 */}
              <div className="pt-2 border-t">
                <AgentSelector
                  selectedAgentIds={newIntegration.agent_ids}
                  onChange={(agentIds) => setNewIntegration({ ...newIntegration, agent_ids: agentIds })}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newIntegration.name}
                className="w-full h-11"
              >
                カレンダー連携を作成
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
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">カレンダー連携が未設定です</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              「追加」ボタンから、<br />
              通話をカレンダーに記録する設定を追加しましょう
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
                      <div className="p-2.5 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg shrink-0">
                        <Calendar className="h-5 w-5 text-white" />
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
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {integration.event_duration_minutes}分のイベント
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {integration.create_on_call_end && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <PhoneOff className="h-3 w-3" />
                              通話終了時
                            </Badge>
                          )}
                          {integration.create_on_call_failed && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              失敗時
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右側: アクション */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={() => handleToggle(integration.id)}
                      />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
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
                    <div className="px-4 sm:px-5 pb-5 pt-2 border-t space-y-4">
                      {/* イベントプレビュー */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">イベントタイトル</Label>
                        <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                          {integration.event_title_template}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">イベント説明</Label>
                        <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap">
                          {integration.event_description_template}
                        </div>
                      </div>

                      {/* 対象エージェント */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          対象エージェント
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {integration.agent_ids === null ? (
                            <Badge variant="secondary">すべてのエージェント</Badge>
                          ) : (
                            integration.agent_ids.map(id => {
                              const agent = agents?.find(a => a.id === id);
                              return agent ? (
                                <Badge key={id} variant="outline">{agent.name}</Badge>
                              ) : null;
                            })
                          )}
                        </div>
                      </div>

                      {/* 削除ボタン */}
                      <div className="flex justify-end pt-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              削除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>カレンダー連携を削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{integration.name}」を削除します。この操作は取り消せません。
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
