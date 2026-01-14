import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronLeft, FileText, Search } from "lucide-react";
import { KnowledgeItemCard } from "@/components/agents/KnowledgeItemCard";
import { FileUploadButton } from "@/components/agents/FileUploadButton";
import { KnowledgeItemDialog } from "./KnowledgeItemDialog";
import type { KnowledgeItem, KnowledgeBase } from "@/hooks/useKnowledgeBase";

interface KnowledgeBaseDetailViewProps {
  knowledgeBase: KnowledgeBase;
  items: KnowledgeItem[];
  onBack: () => void;
  onFileUpload: (file: File) => Promise<void>;
  onCreateItem: (data: { title: string; content: string; category?: string; syncToElevenLabs?: boolean }) => Promise<void>;
  onUpdateItem: (item: KnowledgeItem, data: { title: string; content: string; category?: string; syncToElevenLabs?: boolean }) => Promise<void>;
  onDeleteItem: (item: KnowledgeItem) => Promise<void>;
  isUploading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
}

export function KnowledgeBaseDetailView({
  knowledgeBase,
  items,
  onBack,
  onFileUpload,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  isUploading,
  isCreating,
  isUpdating,
}: KnowledgeBaseDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditItem = useCallback((item: KnowledgeItem) => {
    setEditingItem(item);
    setIsEditItemOpen(true);
  }, []);

  const handleDeleteItem = useCallback(async (item: KnowledgeItem) => {
    if (confirm("このアイテムを削除しますか？")) {
      await onDeleteItem(item);
    }
  }, [onDeleteItem]);

  const handleCreateSubmit = useCallback(async (data: { title: string; content: string; category?: string; syncToElevenLabs?: boolean }) => {
    await onCreateItem(data);
    setIsCreateItemOpen(false);
  }, [onCreateItem]);

  const handleUpdateSubmit = useCallback(async (data: { title: string; content: string; category?: string; syncToElevenLabs?: boolean }) => {
    if (!editingItem) return;
    await onUpdateItem(editingItem, data);
    setEditingItem(null);
    setIsEditItemOpen(false);
  }, [editingItem, onUpdateItem]);

  return (
    <div className="space-y-4">
      {/* Back button and header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          戻る
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{knowledgeBase.name}</h3>
          <p className="text-xs text-muted-foreground">{items.length}件のアイテム</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* File Upload Button */}
        <FileUploadButton
          onFileSelect={onFileUpload}
          isUploading={isUploading}
          label="PDF"
          className="px-3"
        />

        <Button size="sm" className="h-10 shrink-0" onClick={() => setIsCreateItemOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-4">アイテムがありません</p>
            <div className="flex items-center justify-center gap-2">
              <FileUploadButton
                onFileSelect={onFileUpload}
                isUploading={isUploading}
                label="PDFを追加"
              />
              <Button
                variant="default"
                size="sm"
                className="h-10"
                onClick={() => setIsCreateItemOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                テキスト追加
              </Button>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <KnowledgeItemCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          ))
        )}
      </div>

      {/* Create Item Dialog */}
      <KnowledgeItemDialog
        open={isCreateItemOpen}
        onOpenChange={setIsCreateItemOpen}
        mode="create"
        onSubmit={handleCreateSubmit}
        isSubmitting={isCreating}
      />

      {/* Edit Item Dialog */}
      <KnowledgeItemDialog
        open={isEditItemOpen}
        onOpenChange={setIsEditItemOpen}
        mode="edit"
        item={editingItem}
        onSubmit={handleUpdateSubmit}
        isSubmitting={isUpdating}
      />
    </div>
  );
}
