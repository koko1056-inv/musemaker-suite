import { useState } from "react";
import { useAgentExtractionFields, ExtractionField } from "@/hooks/useAgentExtractionFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Variable, HelpCircle, Edit2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentExtractionFieldsProps {
  agentId: string;
}

const fieldTypes = [
  { value: "text", label: "テキスト", description: "自由形式のテキスト" },
  { value: "email", label: "メールアドレス", description: "メールアドレス形式" },
  { value: "phone", label: "電話番号", description: "電話番号形式" },
  { value: "number", label: "数値", description: "数値データ" },
  { value: "date", label: "日付", description: "日付形式" },
  { value: "boolean", label: "はい/いいえ", description: "真偽値" },
];

export function AgentExtractionFields({ agentId }: AgentExtractionFieldsProps) {
  const { fields, isLoading, createField, updateField, deleteField } = useAgentExtractionFields(agentId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<ExtractionField | null>(null);
  const [newField, setNewField] = useState({
    field_name: "",
    field_key: "",
    field_type: "text",
    description: "",
    is_required: false,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleNameChange = (name: string) => {
    setNewField({
      ...newField,
      field_name: name,
      field_key: generateKey(name),
    });
  };

  const handleCreate = async () => {
    if (!newField.field_name || !newField.field_key) return;
    
    await createField.mutateAsync({
      agent_id: agentId,
      field_name: newField.field_name,
      field_key: newField.field_key,
      field_type: newField.field_type,
      description: newField.description || undefined,
      is_required: newField.is_required,
    });
    
    setNewField({
      field_name: "",
      field_key: "",
      field_type: "text",
      description: "",
      is_required: false,
    });
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingField) return;
    
    await updateField.mutateAsync({
      id: editingField.id,
      field_name: editingField.field_name,
      field_type: editingField.field_type,
      description: editingField.description,
      is_required: editingField.is_required,
    });
    
    setEditingField(null);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(`{{extracted.${key}}}`);
    setCopiedKey(key);
    toast({ title: "コピーしました" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 説明セクション */}
      <Card className="bg-gradient-to-r from-violet-500/5 to-purple-500/10 border-violet-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-500/10 rounded-full">
              <Variable className="h-6 w-6 text-violet-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">抽出変数とは？</h3>
              <p className="text-muted-foreground mb-4">
                通話中にAIが自動的に抽出する情報を定義できます。<br />
                抽出したデータはWebhookやメール通知で変数として利用可能です。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 font-bold text-sm">1</div>
                  <span className="text-sm">抽出項目を設定</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 font-bold text-sm">2</div>
                  <span className="text-sm">通話からAIが抽出</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 font-bold text-sm">3</div>
                  <span className="text-sm">Webhook等で活用</span>
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
            抽出フィールド
            <Badge variant="secondary" className="ml-2">{fields.length}件</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            通話から抽出したい情報を定義
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              フィールドを追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">抽出フィールドを追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label>フィールド名 *</Label>
                <Input
                  placeholder="例: お客様の名前、予約日時、問い合わせ内容"
                  value={newField.field_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>変数キー</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Webhookで使用する変数名です。</p>
                        <p className="mt-1 font-mono text-xs">{"{{extracted.customer_name}}"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  placeholder="customer_name"
                  value={newField.field_key}
                  onChange={(e) => setNewField({ ...newField, field_key: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>データタイプ</Label>
                <Select
                  value={newField.field_type}
                  onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <span>{type.label}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>説明（AIへのヒント）</Label>
                <Textarea
                  placeholder="例: お客様がお名前を名乗った場合に抽出してください"
                  value={newField.description}
                  onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>必須フィールド</Label>
                  <p className="text-xs text-muted-foreground">
                    通話中に必ず取得すべき情報
                  </p>
                </div>
                <Switch
                  checked={newField.is_required}
                  onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newField.field_name || !newField.field_key || createField.isPending}
                className="w-full h-12 text-base"
              >
                {createField.isPending ? "作成中..." : "フィールドを作成"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* フィールドリスト */}
      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Variable className="h-10 w-10 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">抽出フィールドが未設定です</h4>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              「フィールドを追加」から、<br />
              通話中に抽出したい情報を設定しましょう
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="text-sm py-1 px-3">お客様名</Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">電話番号</Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">予約日時</Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">問い合わせ内容</Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <Card key={field.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2.5 bg-violet-500/10 rounded-lg shrink-0">
                      <Variable className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{field.field_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}
                        </Badge>
                        {field.is_required && (
                          <Badge variant="default" className="text-xs">必須</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {`{{extracted.${field.field_key}}}`}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyKey(field.field_key)}
                        >
                          {copiedKey === field.field_key ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(field)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          編集
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>フィールドを編集</DialogTitle>
                        </DialogHeader>
                        {editingField && (
                          <div className="space-y-5 pt-4">
                            <div className="space-y-2">
                              <Label>フィールド名</Label>
                              <Input
                                value={editingField.field_name}
                                onChange={(e) => setEditingField({ ...editingField, field_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>変数キー（変更不可）</Label>
                              <Input value={editingField.field_key} disabled className="font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                              <Label>データタイプ</Label>
                              <Select
                                value={editingField.field_type}
                                onValueChange={(value) => setEditingField({ ...editingField, field_type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>説明</Label>
                              <Textarea
                                value={editingField.description || ""}
                                onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>必須フィールド</Label>
                              <Switch
                                checked={editingField.is_required}
                                onCheckedChange={(checked) => setEditingField({ ...editingField, is_required: checked })}
                              />
                            </div>
                            <Button
                              onClick={handleUpdate}
                              disabled={updateField.isPending}
                              className="w-full"
                            >
                              {updateField.isPending ? "更新中..." : "更新する"}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteField.mutate(field.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 使用例 */}
      {fields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Webhookでの使用例</CardTitle>
            <CardDescription>
              抽出したデータは以下の形式でWebhookペイロードに含まれます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`{
  "conversation_id": "uuid",
  "agent_name": "カスタマーサポート",
  "summary": "...",
  "extracted_data": {
${fields.map(f => `    "${f.field_key}": "抽出された値"`).join(",\n")}
  }
}`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
