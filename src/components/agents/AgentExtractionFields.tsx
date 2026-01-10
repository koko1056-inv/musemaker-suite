import { useState } from "react";
import { useAgentExtractionFields, ExtractionField } from "@/hooks/useAgentExtractionFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Trash2, Variable, HelpCircle, Edit2, Copy, Check, ChevronDown, Sparkles, Zap, Mail, Phone, Calendar, Hash, ToggleLeft, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentExtractionFieldsProps {
  agentId: string;
}

const fieldTypes = [
  { value: "text", label: "テキスト", icon: Type },
  { value: "email", label: "メール", icon: Mail },
  { value: "phone", label: "電話番号", icon: Phone },
  { value: "number", label: "数値", icon: Hash },
  { value: "date", label: "日付", icon: Calendar },
  { value: "boolean", label: "はい/いいえ", icon: ToggleLeft },
];

const presetFields = [
  { name: "お客様名", key: "customer_name", type: "text", description: "お客様が名乗った名前" },
  { name: "電話番号", key: "phone_number", type: "phone", description: "連絡先の電話番号" },
  { name: "メールアドレス", key: "email", type: "email", description: "連絡先のメールアドレス" },
  { name: "予約日時", key: "reservation_date", type: "date", description: "予約希望日時" },
  { name: "問い合わせ内容", key: "inquiry_content", type: "text", description: "お客様の質問や要望" },
];

export function AgentExtractionFields({ agentId }: AgentExtractionFieldsProps) {
  const { fields, isLoading, createField, updateField, deleteField } = useAgentExtractionFields(agentId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<ExtractionField | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showUsageExample, setShowUsageExample] = useState(false);
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
    setShowAdvanced(false);
  };

  const handlePresetClick = async (preset: typeof presetFields[0]) => {
    // Check if already exists
    if (fields.some(f => f.field_key === preset.key)) {
      toast({ title: "このフィールドは既に追加されています", variant: "destructive" });
      return;
    }
    
    await createField.mutateAsync({
      agent_id: agentId,
      field_name: preset.name,
      field_key: preset.key,
      field_type: preset.type,
      description: preset.description,
      is_required: false,
    });
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

  const getFieldTypeIcon = (type: string) => {
    const fieldType = fieldTypes.find(t => t.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* コンパクトヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI抽出変数</h3>
            <p className="text-xs text-muted-foreground">
              通話からAIが自動抽出 → Webhook・通知で利用
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono">
          {fields.length}件
        </Badge>
      </div>

      {/* フィールドリスト または 空状態 */}
      {fields.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-muted rounded-full">
                <Variable className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">抽出したい情報を設定しましょう</p>
                <p className="text-sm text-muted-foreground mt-1">
                  よく使う項目をクリックで追加
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {presetFields.map((preset) => (
                  <Button
                    key={preset.key}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    disabled={createField.isPending}
                    className="gap-1.5"
                  >
                    <Plus className="h-3 w-3" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => {
            const TypeIcon = getFieldTypeIcon(field.field_type);
            return (
              <Card key={field.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* ヘッダー部分 */}
                  <div className="flex items-start gap-3 p-3 pb-2">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <TypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{field.field_name}</span>
                        {field.is_required && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">必須</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                          {fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}
                        </Badge>
                      </div>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 変数キー表示 */}
                  <div className="px-3 pb-2">
                    <button
                      onClick={() => handleCopyKey(field.field_key)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group/copy"
                    >
                      <code className="text-xs text-muted-foreground font-mono truncate">
                        {`{{extracted.${field.field_key}}}`}
                      </code>
                      <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                        {copiedKey === field.field_key ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-green-500">コピー済み</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 group-hover/copy:text-foreground transition-colors" />
                            <span className="hidden sm:inline group-hover/copy:text-foreground transition-colors">コピー</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setEditingField(field)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>編集</span>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>フィールドを編集</DialogTitle>
                        </DialogHeader>
                        {editingField && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label>フィールド名</Label>
                              <Input
                                value={editingField.field_name}
                                onChange={(e) => setEditingField({ ...editingField, field_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">変数キー（変更不可）</Label>
                              <Input value={editingField.field_key} disabled className="font-mono text-sm bg-muted" />
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
                                      <div className="flex items-center gap-2">
                                        <type.icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>AIへのヒント</Label>
                              <Textarea
                                value={editingField.description || ""}
                                onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                                placeholder="どのような情報を抽出すべきか説明"
                                rows={2}
                              />
                            </div>
                            <div className="flex items-center justify-between py-2">
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
                              {updateField.isPending ? "更新中..." : "保存"}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <div className="w-px bg-border" />
                    <button
                      onClick={() => deleteField.mutate(field.id)}
                      disabled={deleteField.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>削除</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* フィールド追加ボタン（フィールドがある場合） */}
      {fields.length > 0 && (
        <div className="space-y-3">
          {/* プリセットボタン - スクロール可能 */}
          {presetFields.filter(preset => !fields.some(f => f.field_key === preset.key)).length > 0 && (
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-2 min-w-min">
                {presetFields
                  .filter(preset => !fields.some(f => f.field_key === preset.key))
                  .map((preset) => {
                    const PresetIcon = getFieldTypeIcon(preset.type);
                    return (
                      <Button
                        key={preset.key}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetClick(preset)}
                        disabled={createField.isPending}
                        className="gap-2 shrink-0"
                      >
                        <PresetIcon className="h-3.5 w-3.5" />
                        {preset.name}
                      </Button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* カスタム追加ボタン */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                カスタムフィールドを追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>抽出フィールドを追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>フィールド名 <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="例: お客様の名前"
                    value={newField.field_name}
                    onChange={(e) => handleNameChange(e.target.value)}
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
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                      詳細設定
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>変数キー</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Webhookで使用する変数名</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        value={newField.field_key}
                        onChange={(e) => setNewField({ ...newField, field_key: e.target.value })}
                        className="font-mono text-sm"
                        placeholder="customer_name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>AIへのヒント</Label>
                      <Textarea
                        placeholder="どのような情報を抽出すべきか説明"
                        value={newField.description}
                        onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <Label>必須フィールド</Label>
                      <Switch
                        checked={newField.is_required}
                        onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  onClick={handleCreate}
                  disabled={!newField.field_name || !newField.field_key || createField.isPending}
                  className="w-full"
                >
                  {createField.isPending ? "作成中..." : "追加"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* 使い方ヒント */}
      {fields.length > 0 && (
        <Collapsible open={showUsageExample} onOpenChange={setShowUsageExample}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
              <Zap className="h-4 w-4" />
              <span>使い方を見る</span>
              <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showUsageExample ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 p-4 rounded-lg bg-muted/50 space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Webhook / メール / Slackで使用</p>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map((field) => (
                    <button
                      key={field.id}
                      onClick={() => handleCopyKey(field.field_key)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border text-xs font-mono hover:bg-accent transition-colors"
                    >
                      {`{{extracted.${field.field_key}}}`}
                      {copiedKey === field.field_key ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>例：メール本文に <code className="bg-background px-1 rounded">{"{{extracted.customer_name}}"}</code> と書くと、抽出された顧客名に置換されます</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
