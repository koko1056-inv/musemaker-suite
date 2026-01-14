import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, FolderOpen, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateKnowledgeBaseDialog } from "@/components/agents/knowledge/CreateKnowledgeBaseDialog";
import type { KnowledgeBase, KnowledgeItem } from "@/hooks/useKnowledgeBase";
import type { KnowledgeBaseFolder } from "@/hooks/useKnowledgeBaseFolders";

interface BookshelfViewProps {
  knowledgeBases: KnowledgeBase[];
  folders: KnowledgeBaseFolder[];
  isLoading: boolean;
  selectedKbId: string | null;
  onSelectKb: (id: string) => void;
  onDeleteKb: (id: string) => void;
  onCreateKb: (data: { name: string; description: string; files: File[] }) => Promise<void>;
  onMoveToFolder: (kbId: string, folderId: string | null) => Promise<void>;
  onCreateFolder: (name: string, color: string) => Promise<unknown>;
  onUpdateFolder: (id: string, updates: { name?: string; color?: string }) => Promise<unknown>;
  onDeleteFolder: (id: string) => Promise<unknown>;
  isCreating: boolean;
  knowledgeItemsByKb: Record<string, KnowledgeItem[]>;
}

// 本のコンポーネント
function Book({ 
  kb, 
  isSelected, 
  onSelect,
  itemCount 
}: { 
  kb: KnowledgeBase; 
  isSelected: boolean; 
  onSelect: () => void;
  itemCount: number;
}) {
  // ナレッジベース名からカラーを生成
  const colors = [
    { spine: "bg-amber-700", cover: "bg-amber-600", pages: "bg-amber-50" },
    { spine: "bg-emerald-700", cover: "bg-emerald-600", pages: "bg-emerald-50" },
    { spine: "bg-blue-700", cover: "bg-blue-600", pages: "bg-blue-50" },
    { spine: "bg-purple-700", cover: "bg-purple-600", pages: "bg-purple-50" },
    { spine: "bg-rose-700", cover: "bg-rose-600", pages: "bg-rose-50" },
    { spine: "bg-orange-700", cover: "bg-orange-600", pages: "bg-orange-50" },
    { spine: "bg-teal-700", cover: "bg-teal-600", pages: "bg-teal-50" },
    { spine: "bg-indigo-700", cover: "bg-indigo-600", pages: "bg-indigo-50" },
  ];
  
  const colorIndex = kb.name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  // 厚さをアイテム数に応じて変更（最小16px、最大40px）
  const thickness = Math.min(40, Math.max(16, itemCount * 4 + 16));

  return (
    <button
      onClick={onSelect}
      className={`group relative cursor-pointer transition-all duration-300 hover:-translate-y-2 ${
        isSelected ? "-translate-y-3 scale-105" : ""
      }`}
      style={{ width: `${thickness}px` }}
    >
      {/* 本の背表紙 */}
      <div 
        className={`relative h-32 rounded-sm shadow-lg ${color.spine} ${
          isSelected ? "ring-2 ring-primary ring-offset-2" : ""
        }`}
        style={{ width: `${thickness}px` }}
      >
        {/* 背表紙のタイトル（縦書き） */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span 
            className="text-white text-[10px] font-medium whitespace-nowrap"
            style={{ 
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              maxHeight: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {kb.name.length > 8 ? kb.name.slice(0, 8) + "..." : kb.name}
          </span>
        </div>
        
        {/* 背表紙の装飾ライン */}
        <div className="absolute top-2 left-0 right-0 h-px bg-white/30" />
        <div className="absolute bottom-2 left-0 right-0 h-px bg-white/30" />
        
        {/* アイテム数バッジ */}
        {itemCount > 0 && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge variant="secondary" className="h-5 min-w-5 text-[10px] px-1 bg-background shadow-md">
              {itemCount}
            </Badge>
          </div>
        )}
      </div>
      
      {/* ホバー時のツールチップ */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
          {kb.name}
        </div>
      </div>
    </button>
  );
}

// 本棚の段コンポーネント
function BookshelfRow({ 
  title, 
  books, 
  color,
  selectedKbId,
  onSelectKb,
  knowledgeItemsByKb 
}: { 
  title: string; 
  books: KnowledgeBase[];
  color?: string | null;
  selectedKbId: string | null;
  onSelectKb: (id: string) => void;
  knowledgeItemsByKb: Record<string, KnowledgeItem[]>;
}) {
  return (
    <div className="relative">
      {/* 本棚の段ラベル */}
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color || "#8B4513" }} 
        />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Badge variant="outline" className="text-xs">{books.length}</Badge>
      </div>
      
      {/* 本棚の板 */}
      <div className="relative">
        {/* 本を並べるエリア */}
        <div className="flex items-end gap-1 min-h-[140px] px-3 pt-2 pb-3 bg-gradient-to-b from-amber-900/10 to-amber-800/20 rounded-t-lg border-x border-t border-amber-900/20">
          {books.length === 0 ? (
            <div className="flex items-center justify-center w-full h-32 text-muted-foreground text-sm">
              <FileText className="h-5 w-5 mr-2 opacity-50" />
              まだ本がありません
            </div>
          ) : (
            books.map((kb) => (
              <Book 
                key={kb.id} 
                kb={kb} 
                isSelected={selectedKbId === kb.id}
                onSelect={() => onSelectKb(kb.id)}
                itemCount={knowledgeItemsByKb[kb.id]?.length || 0}
              />
            ))
          )}
        </div>
        
        {/* 本棚の板（下部） */}
        <div className="h-3 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-md" />
        
        {/* 影 */}
        <div className="absolute -bottom-2 left-2 right-2 h-2 bg-black/10 blur-sm rounded-full" />
      </div>
    </div>
  );
}

export function BookshelfView({
  knowledgeBases,
  folders,
  isLoading,
  selectedKbId,
  onSelectKb,
  onCreateKb,
  isCreating,
  knowledgeItemsByKb,
}: BookshelfViewProps) {
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const kbsInFolder = (folderId: string) =>
    knowledgeBases.filter((kb) => kb.folder_id === folderId);
  const kbsWithoutFolder = knowledgeBases.filter((kb) => !kb.folder_id);

  // 検索フィルタ
  const filteredKbs = knowledgeBases.filter((kb) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateKb = async (data: { name: string; description: string; files: File[] }) => {
    await onCreateKb(data);
    setIsCreateKbOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="animate-pulse">本棚を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ナレッジ本棚</h2>
            <p className="text-sm text-muted-foreground">
              {knowledgeBases.length}冊の本
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="本を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button onClick={() => setIsCreateKbOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            新規
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateKnowledgeBaseDialog
        open={isCreateKbOpen}
        onOpenChange={setIsCreateKbOpen}
        onSubmit={handleCreateKb}
        isSubmitting={isCreating}
      />

      {/* 本棚 */}
      <div className="space-y-8 p-4 bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
        {/* フォルダごとの棚 */}
        {folders.map((folder) => {
          const booksInFolder = searchQuery 
            ? kbsInFolder(folder.id).filter(kb => filteredKbs.includes(kb))
            : kbsInFolder(folder.id);
          
          return (
            <BookshelfRow
              key={folder.id}
              title={folder.name}
              color={folder.color}
              books={booksInFolder}
              selectedKbId={selectedKbId}
              onSelectKb={onSelectKb}
              knowledgeItemsByKb={knowledgeItemsByKb}
            />
          );
        })}

        {/* フォルダなしの本 */}
        {kbsWithoutFolder.length > 0 && (
          <BookshelfRow
            title={folders.length > 0 ? "未分類" : "すべての本"}
            books={searchQuery ? kbsWithoutFolder.filter(kb => filteredKbs.includes(kb)) : kbsWithoutFolder}
            selectedKbId={selectedKbId}
            onSelectKb={onSelectKb}
            knowledgeItemsByKb={knowledgeItemsByKb}
          />
        )}

        {/* 空の状態 */}
        {knowledgeBases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <FolderOpen className="h-10 w-10 text-amber-600/50" />
            </div>
            <p className="text-lg font-medium mb-1">本棚は空です</p>
            <p className="text-sm mb-4">新しい本を追加しましょう</p>
            <Button onClick={() => setIsCreateKbOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              最初の本を追加
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
