import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { FileUploadButton } from "@/components/agents/FileUploadButton";

interface CreateKnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    files: File[];
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateKnowledgeBaseDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateKnowledgeBaseDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSubmit({ name, description, files: pendingFiles });
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPendingFiles([]);
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
          <DialogTitle>新規ナレッジベース</DialogTitle>
          <DialogDescription>
            FAQや製品情報を整理するフォルダを作成
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>名前</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 製品FAQ"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>説明（任意）</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="何を保存するか..."
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>ファイルを追加（任意）</Label>
            <div className="flex items-center gap-2">
              <FileUploadButton
                onFileSelect={(file) => setPendingFiles((prev) => [...prev, file])}
                isUploading={false}
                label="PDFを選択"
                className="flex-1"
              />
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-1 mt-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() =>
                        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {pendingFiles.length}件のファイルを追加予定
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? "作成中..."
              : pendingFiles.length > 0
              ? `作成 (${pendingFiles.length}件アップロード)`
              : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
