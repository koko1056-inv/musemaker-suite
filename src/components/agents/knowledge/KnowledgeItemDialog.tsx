import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudUpload, Loader2 } from "lucide-react";
import type { KnowledgeItem } from "@/hooks/useKnowledgeBase";

const CATEGORIES = [
  { value: "faq", label: "FAQ" },
  { value: "product", label: "製品情報" },
  { value: "policy", label: "ポリシー" },
  { value: "guide", label: "ガイド" },
  { value: "other", label: "その他" },
] as const;

interface KnowledgeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  item?: KnowledgeItem | null;
  onSubmit: (data: { title: string; content: string; category?: string; syncToElevenLabs?: boolean }) => Promise<void>;
  isSubmitting: boolean;
}

export function KnowledgeItemDialog({
  open,
  onOpenChange,
  mode,
  item,
  onSubmit,
  isSubmitting,
}: KnowledgeItemDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [syncToElevenLabs, setSyncToElevenLabs] = useState(true);

  // Reset form when item changes (for edit mode)
  useEffect(() => {
    if (item && mode === "edit") {
      setTitle(item.title);
      setContent(item.content);
      setCategory(item.category || "");
    } else if (mode === "create") {
      setTitle("");
      setContent("");
      setCategory("");
    }
  }, [item, mode, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    await onSubmit({
      title,
      content,
      category: category || undefined,
      syncToElevenLabs,
    });
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "アイテム追加" : "アイテム編集"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>タイトル</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 返品ポリシーについて"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="AIに教えたい情報を入力..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="選択..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* ElevenLabs自動同期オプション */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="sync-elevenlabs" className="cursor-pointer">
                  ElevenLabsに自動同期
                </Label>
                <p className="text-xs text-muted-foreground">
                  保存時にElevenLabs KBへアップロード
                </p>
              </div>
            </div>
            <Switch
              id="sync-elevenlabs"
              checked={syncToElevenLabs}
              onCheckedChange={setSyncToElevenLabs}
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {syncToElevenLabs ? "同期中..." : "保存中..."}
              </>
            ) : (
              mode === "create" ? "追加" : "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
