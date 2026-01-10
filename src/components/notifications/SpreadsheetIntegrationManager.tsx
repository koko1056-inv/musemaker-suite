import { useState, useEffect } from "react";
import { useSpreadsheetIntegrations, SpreadsheetIntegration } from "@/hooks/useSpreadsheetIntegrations";
import { useAgents } from "@/hooks/useAgents";
import { useWorkspace } from "@/hooks/useWorkspace";
import { AgentSelector } from "./AgentSelector";
import { ColumnMappingEditor } from "./ColumnMappingEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  ChevronDown,
  ChevronUp,
  Settings2,
  ExternalLink,
  HelpCircle,
  FileText,
  MessageSquare,
  PhoneOff,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Table,
  Link2,
  LogIn,
  CheckCircle2,
  XCircle,
  Database,
  Columns,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface SpreadsheetIntegrationManagerProps {
  workspaceId: string;
}

export function SpreadsheetIntegrationManager({ workspaceId }: SpreadsheetIntegrationManagerProps) {
  const {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    startOAuthFlow,
    listSpreadsheets,
    listSheets,
    refetch,
  } = useSpreadsheetIntegrations(workspaceId);

  const { workspace } = useWorkspace();
  const { agents } = useAgents();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSpreadsheetId, setEditingSpreadsheetId] = useState<string | null>(null);
  const [editingSpreadsheetUrl, setEditingSpreadsheetUrl] = useState("");
  const [spreadsheetOptions, setSpreadsheetOptions] = useState<Record<string, { id: string; name: string }[]>>({});
  const [sheetOptions, setSheetOptions] = useState<Record<string, { id: number; name: string }[]>>({});
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState<Record<string, boolean>>({});
  const [loadingSheets, setLoadingSheets] = useState<Record<string, boolean>>({});
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    spreadsheet_id: "",
    sheet_name: "Sheet1",
    export_on_call_end: true,
    export_on_call_failed: false,
    include_transcript: false,
    include_summary: true,
    include_extracted_data: true,
    agent_ids: null as string[] | null,
  });

  // Listen for OAuth success message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-oauth-success') {
        refetch();
        toast({
          title: "認証完了",
          description: "Googleアカウントとの連携が完了しました",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch, toast]);

  const hasGoogleCredentials = workspace?.google_client_id && workspace?.google_client_secret;

  const extractSpreadsheetId = (url: string): string => {
    // Extract ID from Google Sheets URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleCreate = async () => {
    if (!newIntegration.name) {
      toast({
        title: "入力エラー",
        description: "名前は必須です",
        variant: "destructive",
      });
      return;
    }

    await createIntegration.mutateAsync({
      name: newIntegration.name,
      spreadsheet_id: extractSpreadsheetId(newIntegration.spreadsheet_id),
      sheet_name: newIntegration.sheet_name || "Sheet1",
      export_on_call_end: newIntegration.export_on_call_end,
      export_on_call_failed: newIntegration.export_on_call_failed,
      include_transcript: newIntegration.include_transcript,
      include_summary: newIntegration.include_summary,
      include_extracted_data: newIntegration.include_extracted_data,
      agent_ids: newIntegration.agent_ids,
    });

    setNewIntegration({
      name: "",
      spreadsheet_id: "",
      sheet_name: "Sheet1",
      export_on_call_end: true,
      export_on_call_failed: false,
      include_transcript: false,
      include_summary: true,
      include_extracted_data: true,
      agent_ids: null,
    });
    setIsCreateOpen(false);
  };

  const handleStartEditSpreadsheet = (integration: SpreadsheetIntegration) => {
    setEditingSpreadsheetId(integration.id);
    setEditingSpreadsheetUrl(integration.spreadsheet_id || "");
  };

  const handleSaveSpreadsheetId = async (id: string) => {
    await updateIntegration.mutateAsync({
      id,
      spreadsheet_id: extractSpreadsheetId(editingSpreadsheetUrl),
    });
    setEditingSpreadsheetId(null);
    setEditingSpreadsheetUrl("");
  };

  const handleCancelEditSpreadsheet = () => {
    setEditingSpreadsheetId(null);
    setEditingSpreadsheetUrl("");
  };

  const handleAuthorize = async (integrationId: string) => {
    if (!hasGoogleCredentials) {
      toast({
        title: "設定が必要です",
        description: "先に設定 > API連携でGoogle Calendar認証情報を設定してください",
        variant: "destructive",
      });
      return;
    }
    await startOAuthFlow(integrationId);
  };

  const handleLoadSpreadsheets = async (integrationId: string) => {
    setLoadingSpreadsheets(prev => ({ ...prev, [integrationId]: true }));
    try {
      const spreadsheets = await listSpreadsheets(integrationId);
      setSpreadsheetOptions(prev => ({ ...prev, [integrationId]: spreadsheets }));
    } finally {
      setLoadingSpreadsheets(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleSelectSpreadsheet = async (integrationId: string, spreadsheetId: string) => {
    await updateIntegration.mutateAsync({
      id: integrationId,
      spreadsheet_id: spreadsheetId,
    });
    setEditingSpreadsheetId(null);
    // Load sheets for the selected spreadsheet
    handleLoadSheets(integrationId, spreadsheetId);
  };

  const handleLoadSheets = async (integrationId: string, spreadsheetId: string) => {
    if (!spreadsheetId) return;
    setLoadingSheets(prev => ({ ...prev, [integrationId]: true }));
    try {
      const sheets = await listSheets(integrationId, spreadsheetId);
      setSheetOptions(prev => ({ ...prev, [integrationId]: sheets }));
    } finally {
      setLoadingSheets(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleSelectSheet = async (integrationId: string, sheetName: string) => {
    await updateIntegration.mutateAsync({
      id: integrationId,
      sheet_name: sheetName,
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーと追加ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
            <Table className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Google スプレッドシート</h3>
            <p className="text-sm text-muted-foreground">
              通話データを自動でスプレッドシートに出力
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
                <Table className="h-5 w-5 text-green-600" />
                スプレッドシート連携を追加
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              {/* 認証情報の確認 */}
              {!hasGoogleCredentials && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-600">Google認証情報が未設定</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        設定 → API連携でGoogle Client IDとClient Secretを設定してください
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 基本設定 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">連携名</Label>
                  <Input
                    placeholder="例: 営業ログ、問い合わせ記録"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">スプレッドシートURL / ID（任意）</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Google認証後に設定することもできます</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={newIntegration.spreadsheet_id}
                    onChange={(e) => setNewIntegration({ ...newIntegration, spreadsheet_id: e.target.value })}
                    className="h-11 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">シート名</Label>
                  <Input
                    placeholder="Sheet1"
                    value={newIntegration.sheet_name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, sheet_name: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>

              {/* エージェント選択 */}
              <div className="pt-2 border-t">
                <AgentSelector
                  selectedAgentIds={newIntegration.agent_ids}
                  onChange={(agentIds) => setNewIntegration({ ...newIntegration, agent_ids: agentIds })}
                />
              </div>

              {/* 出力タイミング */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  出力タイミング
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <PhoneOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">通話終了時</span>
                    </div>
                    <Switch
                      checked={newIntegration.export_on_call_end}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, export_on_call_end: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">通話失敗時</span>
                    </div>
                    <Switch
                      checked={newIntegration.export_on_call_failed}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, export_on_call_failed: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 出力内容 */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  出力内容
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">サマリー</span>
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
                      <span className="text-sm">トランスクリプト</span>
                    </div>
                    <Switch
                      checked={newIntegration.include_transcript}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, include_transcript: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">抽出データ</span>
                    </div>
                    <Switch
                      checked={newIntegration.include_extracted_data}
                      onCheckedChange={(checked) =>
                        setNewIntegration({ ...newIntegration, include_extracted_data: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newIntegration.name || createIntegration.isPending}
                className="w-full h-11"
              >
                {createIntegration.isPending ? "作成中..." : "スプレッドシート連携を作成"}
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
              <Table className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">スプレッドシート連携が未設定です</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              「追加」ボタンから、<br />
              通話データの出力先を設定しましょう
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
                      <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shrink-0">
                        <Table className="h-5 w-5 text-white" />
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
                          {integration.is_authorized ? (
                            <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                              認証済み
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-200">
                              <XCircle className="h-3 w-3" />
                              未認証
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {integration.spreadsheet_id ? (
                            <span className="truncate font-mono text-xs">
                              ID: {integration.spreadsheet_id.slice(0, 20)}...
                            </span>
                          ) : (
                            <span className="text-xs">スプレッドシート未設定</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右側: アクション */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!integration.is_authorized && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleAuthorize(integration.id)}
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Google認証
                        </Button>
                      )}
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={(checked) =>
                          toggleIntegration.mutate({ id: integration.id, is_active: checked })
                        }
                      />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <div className="border-t px-4 sm:px-5 py-4 space-y-4 bg-muted/30">
                      {/* スプレッドシート選択（認証済みの場合） */}
                      {integration.is_authorized && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Table className="h-4 w-4" />
                              スプレッドシートを選択
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={() => handleLoadSpreadsheets(integration.id)}
                              disabled={loadingSpreadsheets[integration.id]}
                            >
                              {loadingSpreadsheets[integration.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              候補を読み込む
                            </Button>
                          </div>
                          {spreadsheetOptions[integration.id] && spreadsheetOptions[integration.id].length > 0 && (
                            <Select
                              value={integration.spreadsheet_id || ""}
                              onValueChange={(value) => handleSelectSpreadsheet(integration.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="スプレッドシートを選択..." />
                              </SelectTrigger>
                              <SelectContent>
                                {spreadsheetOptions[integration.id].map((sheet) => (
                                  <SelectItem key={sheet.id} value={sheet.id}>
                                    {sheet.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}

                      {/* スプレッドシートID編集 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          スプレッドシートID（手動入力）
                        </Label>
                        {editingSpreadsheetId === integration.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingSpreadsheetUrl}
                              onChange={(e) => setEditingSpreadsheetUrl(e.target.value)}
                              placeholder="スプレッドシートURLまたはID"
                              className="flex-1 font-mono text-sm"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveSpreadsheetId(integration.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEditSpreadsheet}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono truncate">
                              {integration.spreadsheet_id || "未設定"}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleStartEditSpreadsheet(integration)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {integration.spreadsheet_id && (
                              <Button size="icon" variant="ghost" asChild>
                                <a
                                  href={`https://docs.google.com/spreadsheets/d/${integration.spreadsheet_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* シート名選択 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">シート名</Label>
                          {integration.spreadsheet_id && integration.is_authorized && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={() => handleLoadSheets(integration.id, integration.spreadsheet_id!)}
                              disabled={loadingSheets[integration.id]}
                            >
                              {loadingSheets[integration.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              候補を読み込む
                            </Button>
                          )}
                        </div>
                        {sheetOptions[integration.id] && sheetOptions[integration.id].length > 0 ? (
                          <Select
                            value={integration.sheet_name || ""}
                            onValueChange={(value) => handleSelectSheet(integration.id, value)}
                          >
                            <SelectTrigger className="max-w-xs">
                              <SelectValue placeholder="シートを選択..." />
                            </SelectTrigger>
                            <SelectContent>
                              {sheetOptions[integration.id].map((sheet) => (
                                <SelectItem key={sheet.id} value={sheet.name}>
                                  {sheet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={integration.sheet_name || "Sheet1"}
                            onChange={(e) =>
                              updateIntegration.mutate({
                                id: integration.id,
                                sheet_name: e.target.value,
                              })
                            }
                            placeholder="Sheet1"
                            className="max-w-xs"
                          />
                        )}
                      </div>

                      {/* 設定トグル */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <span className="text-sm">通話終了時に出力</span>
                          <Switch
                            checked={integration.export_on_call_end}
                            onCheckedChange={(checked) =>
                              updateIntegration.mutate({
                                id: integration.id,
                                export_on_call_end: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <span className="text-sm">通話失敗時に出力</span>
                          <Switch
                            checked={integration.export_on_call_failed}
                            onCheckedChange={(checked) =>
                              updateIntegration.mutate({
                                id: integration.id,
                                export_on_call_failed: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <span className="text-sm">サマリーを含める</span>
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
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
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
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <span className="text-sm">抽出データ</span>
                          <Switch
                            checked={integration.include_extracted_data}
                            onCheckedChange={(checked) =>
                              updateIntegration.mutate({
                                id: integration.id,
                                include_extracted_data: checked,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* カラムマッピング設定 */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Columns className="h-4 w-4" />
                              出力カラム設定
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              抽出データを個別の列として出力できます
                            </p>
                          </div>
                          <ColumnMappingEditor
                            integrationId={integration.id}
                            agentIds={integration.agent_ids}
                            currentMapping={integration.column_mapping}
                            onSave={(mapping) =>
                              updateIntegration.mutate({
                                id: integration.id,
                                column_mapping: mapping,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* 削除ボタン */}
                      <div className="pt-2 border-t">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => deleteIntegration.mutate(integration.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          削除
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
