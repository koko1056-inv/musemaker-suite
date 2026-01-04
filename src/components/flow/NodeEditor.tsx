import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NodeType } from "./FlowNode";
import { 
  Play, 
  Trash2, 
  X, 
  MessageSquare, 
  HelpCircle, 
  GitBranch, 
  Webhook, 
  StopCircle,
  Copy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeEditorProps {
  node: {
    id: string;
    type: NodeType;
    title: string;
    description?: string;
  };
  onClose: () => void;
}

const nodeConfig: Record<NodeType, { 
  icon: typeof MessageSquare; 
  gradient: string;
  label: string;
}> = {
  speak: {
    icon: MessageSquare,
    gradient: "from-blue-500 to-blue-600",
    label: "発話ノード",
  },
  ask: {
    icon: HelpCircle,
    gradient: "from-purple-500 to-purple-600",
    label: "質問ノード",
  },
  condition: {
    icon: GitBranch,
    gradient: "from-amber-500 to-orange-500",
    label: "条件分岐ノード",
  },
  webhook: {
    icon: Webhook,
    gradient: "from-emerald-500 to-green-600",
    label: "Webhookノード",
  },
  end: {
    icon: StopCircle,
    gradient: "from-rose-500 to-red-600",
    label: "終了ノード",
  },
};

export function NodeEditor({ node, onClose }: NodeEditorProps) {
  const config = nodeConfig[node.type];
  const Icon = config.icon;

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
            `bg-gradient-to-br ${config.gradient}`
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.label}</h3>
            <p className="text-xs text-muted-foreground">設定を編集</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-6">
        {/* Node Title */}
        <div className="space-y-2">
          <Label htmlFor="node-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ノード名
          </Label>
          <Input 
            id="node-title" 
            defaultValue={node.title} 
            className="h-11 rounded-xl border-2 focus:border-primary"
          />
        </div>

        {/* Type-specific settings */}
        {node.type === "speak" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="speak-text" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                メッセージ
              </Label>
              <Textarea
                id="speak-text"
                placeholder="伝えるメッセージを入力..."
                rows={4}
                defaultValue="こんにちは！本日はどのようなご用件でしょうか？"
                className="rounded-xl border-2 focus:border-primary resize-none"
              />
              <Button variant="outline" size="sm" className="gap-2 text-xs rounded-lg">
                <Sparkles className="h-3 w-3" />
                AIで生成
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                音声
              </Label>
              <Select defaultValue="rachel">
                <SelectTrigger className="h-11 rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rachel">レイチェル</SelectItem>
                  <SelectItem value="josh">ジョシュ</SelectItem>
                  <SelectItem value="sarah">サラ</SelectItem>
                  <SelectItem value="adam">アダム</SelectItem>
                  <SelectItem value="emily">エミリー</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="w-full gap-2 h-11 rounded-xl">
              <Play className="h-4 w-4" />
              音声をプレビュー
            </Button>
          </>
        )}

        {node.type === "ask" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ask-prompt" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                質問
              </Label>
              <Textarea
                id="ask-prompt"
                placeholder="何を質問しますか？"
                rows={3}
                defaultValue="本日はどのようなご用件でしょうか？"
                className="rounded-xl border-2 focus:border-primary resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="variable" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                回答の保存先
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                <Input 
                  id="variable" 
                  placeholder="user_intent" 
                  defaultValue="user_response" 
                  className="h-11 rounded-xl border-2 pl-7 font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                期待される回答（任意）
              </Label>
              <Textarea
                placeholder="営業, サポート, 請求, その他"
                rows={2}
                className="rounded-xl border-2 focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                カンマ区切りで期待される回答を入力
              </p>
            </div>
          </>
        )}

        {node.type === "condition" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                条件変数
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                <Input 
                  placeholder="user_intent" 
                  defaultValue="user_response" 
                  className="h-11 rounded-xl border-2 pl-7 font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                分岐ルール
              </Label>
              <div className="space-y-3">
                {[
                  { value: "営業", target: "営業フロー", color: "bg-blue-500" },
                  { value: "サポート", target: "サポートフロー", color: "bg-purple-500" },
                  { value: "デフォルト", target: "一般フロー", color: "bg-gray-500" },
                ].map((branch, i) => (
                  <div key={i} className="flex gap-2 items-center p-3 rounded-xl bg-muted/50 border border-border">
                    <div className={cn("w-2 h-2 rounded-full", branch.color)} />
                    <Input 
                      placeholder="値" 
                      defaultValue={branch.value} 
                      className="flex-1 h-9 rounded-lg border-2" 
                      readOnly={branch.value === "デフォルト"}
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input 
                      placeholder="遷移先" 
                      defaultValue={branch.target} 
                      className="flex-1 h-9 rounded-lg border-2" 
                    />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Plus className="h-3 w-3" />
                分岐を追加
              </Button>
            </div>
          </>
        )}

        {node.type === "webhook" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                HTTPメソッド
              </Label>
              <Select defaultValue="post">
                <SelectTrigger className="h-11 rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get">GET</SelectItem>
                  <SelectItem value="post">POST</SelectItem>
                  <SelectItem value="put">PUT</SelectItem>
                  <SelectItem value="delete">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook-url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                エンドポイントURL
              </Label>
              <Input
                id="webhook-url"
                placeholder="https://api.example.com/webhook"
                defaultValue="https://api.example.com/lookup"
                className="h-11 rounded-xl border-2 font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook-body" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                リクエストボディ（JSON）
              </Label>
              <Textarea
                id="webhook-body"
                placeholder='{"key": "value"}'
                rows={4}
                className="font-mono text-sm rounded-xl border-2 focus:border-primary resize-none"
                defaultValue={'{\n  "phone": "{{caller_phone}}"\n}'}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                レスポンスの保存先
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                <Input 
                  placeholder="api_response" 
                  defaultValue="customer_data" 
                  className="h-11 rounded-xl border-2 pl-7 font-mono"
                />
              </div>
            </div>
          </>
        )}

        {node.type === "end" && (
          <div className="space-y-2">
            <Label htmlFor="end-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              お別れメッセージ
            </Label>
            <Textarea
              id="end-message"
              placeholder="お電話ありがとうございました！"
              rows={3}
              defaultValue="お電話ありがとうございました。失礼いたします。"
              className="rounded-xl border-2 focus:border-primary resize-none"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 flex gap-2 bg-card/80">
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <Copy className="h-4 w-4" />
          複製
        </Button>
        <Button variant="destructive" size="sm" className="gap-2 rounded-xl">
          <Trash2 className="h-4 w-4" />
          削除
        </Button>
        <Button className={cn(
          "flex-1 rounded-xl shadow-lg",
          `bg-gradient-to-r ${config.gradient} hover:opacity-90`
        )}>
          変更を保存
        </Button>
      </div>
    </div>
  );
}

// Need Plus icon import
import { Plus } from "lucide-react";
