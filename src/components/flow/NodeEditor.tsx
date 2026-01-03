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
import { Play, Trash2, X } from "lucide-react";

interface NodeEditorProps {
  node: {
    id: string;
    type: NodeType;
    title: string;
    description?: string;
  };
  onClose: () => void;
}

export function NodeEditor({ node, onClose }: NodeEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold text-foreground">ノードを編集</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="node-title">ノード名</Label>
          <Input id="node-title" defaultValue={node.title} />
        </div>

        {node.type === "speak" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="speak-text">メッセージ</Label>
              <Textarea
                id="speak-text"
                placeholder="伝えるメッセージを入力..."
                rows={4}
                defaultValue="こんにちは！本日はどのようなご用件でしょうか？"
              />
            </div>
            <div className="space-y-2">
              <Label>音声</Label>
              <Select defaultValue="rachel">
                <SelectTrigger>
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
            <Button variant="outline" className="w-full gap-2">
              <Play className="h-4 w-4" />
              音声をプレビュー
            </Button>
          </>
        )}

        {node.type === "ask" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ask-prompt">質問</Label>
              <Textarea
                id="ask-prompt"
                placeholder="何を質問しますか？"
                rows={3}
                defaultValue="本日はどのようなご用件でしょうか？"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable">回答の保存先</Label>
              <Input id="variable" placeholder="user_intent" defaultValue="user_response" />
            </div>
            <div className="space-y-2">
              <Label>期待される回答（任意）</Label>
              <Textarea
                placeholder="営業, サポート, 請求, その他"
                rows={2}
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
              <Label>条件変数</Label>
              <Input placeholder="user_intent" defaultValue="user_response" />
            </div>
            <div className="space-y-3">
              <Label>分岐</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="値" defaultValue="営業" className="flex-1" />
                  <Input placeholder="遷移先" defaultValue="営業フロー" className="flex-1" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="値" defaultValue="サポート" className="flex-1" />
                  <Input placeholder="遷移先" defaultValue="サポートフロー" className="flex-1" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="値" value="デフォルト" readOnly className="flex-1 opacity-50" />
                  <Input placeholder="遷移先" defaultValue="一般フロー" className="flex-1" />
                </div>
              </div>
              <Button variant="outline" size="sm">分岐を追加</Button>
            </div>
          </>
        )}

        {node.type === "webhook" && (
          <>
            <div className="space-y-2">
              <Label>HTTPメソッド</Label>
              <Select defaultValue="post">
                <SelectTrigger>
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
              <Label htmlFor="webhook-url">エンドポイントURL</Label>
              <Input
                id="webhook-url"
                placeholder="https://api.example.com/webhook"
                defaultValue="https://api.example.com/lookup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-body">リクエストボディ（JSON）</Label>
              <Textarea
                id="webhook-body"
                placeholder='{"key": "value"}'
                rows={4}
                className="font-mono text-sm"
                defaultValue={'{\n  "phone": "{{caller_phone}}"\n}'}
              />
            </div>
            <div className="space-y-2">
              <Label>レスポンスの保存先</Label>
              <Input placeholder="api_response" defaultValue="customer_data" />
            </div>
          </>
        )}

        {node.type === "end" && (
          <div className="space-y-2">
            <Label htmlFor="end-message">お別れメッセージ</Label>
            <Textarea
              id="end-message"
              placeholder="お電話ありがとうございました！"
              rows={3}
              defaultValue="お電話ありがとうございました。失礼いたします。"
            />
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 flex gap-2">
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          削除
        </Button>
        <Button className="flex-1">変更を保存</Button>
      </div>
    </div>
  );
}
