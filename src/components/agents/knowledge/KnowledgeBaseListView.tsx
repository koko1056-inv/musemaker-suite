import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  BookOpen,
  FolderOpen,
  MoreHorizontal,
  Folder,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { FolderManager, FolderItemMenu } from "@/components/agents/FolderManager";
import { CreateKnowledgeBaseDialog } from "./CreateKnowledgeBaseDialog";
import type { KnowledgeBase } from "@/hooks/useKnowledgeBase";
import type { KnowledgeBaseFolder } from "@/hooks/useKnowledgeBaseFolders";

interface KnowledgeBaseListViewProps {
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
}

interface KnowledgeBaseItemProps {
  kb: KnowledgeBase;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  folders: KnowledgeBaseFolder[];
  onMoveToFolder: (kbId: string, folderId: string | null) => void;
}

function KnowledgeBaseItem({
  kb,
  isSelected,
  onSelect,
  onDelete,
  folders,
  onMoveToFolder,
}: KnowledgeBaseItemProps) {
  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors min-h-[48px] ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted active:bg-muted"
      }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{kb.name}</p>
        {kb.description && (
          <p
            className={`text-xs truncate ${
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {kb.description}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className={`opacity-0 group-hover:opacity-100 h-8 w-8 ${
              isSelected ? "hover:bg-primary-foreground/10" : ""
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {folders.length > 0 && (
            <>
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                フォルダに移動
              </DropdownMenuItem>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onMoveToFolder(kb.id, folder.id)}
                >
                  <Folder
                    className="h-4 w-4 mr-2"
                    style={{ color: folder.color || "#6366f1" }}
                  />
                  {folder.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => onMoveToFolder(kb.id, null)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                フォルダから外す
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function KnowledgeBaseListView({
  knowledgeBases,
  folders,
  isLoading,
  selectedKbId,
  onSelectKb,
  onDeleteKb,
  onCreateKb,
  onMoveToFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isCreating,
}: KnowledgeBaseListViewProps) {
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const kbsInFolder = (folderId: string) =>
    knowledgeBases.filter((kb) => kb.folder_id === folderId);
  const kbsWithoutFolder = knowledgeBases.filter((kb) => !kb.folder_id);

  const handleDelete = (id: string) => {
    if (confirm("このナレッジベースを削除しますか？")) {
      onDeleteKb(id);
    }
  };

  const handleCreateKb = async (data: { name: string; description: string; files: File[] }) => {
    await onCreateKb(data);
    setIsCreateKbOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">ナレッジベース</h3>
            <p className="text-xs text-muted-foreground">
              {knowledgeBases.length}件・選択して追加/アップロード
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setIsCreateKbOpen(true)}>
          <Plus className="h-4 w-4" />
          新規
        </Button>
      </div>

      {/* Create Dialog */}
      <CreateKnowledgeBaseDialog
        open={isCreateKbOpen}
        onOpenChange={setIsCreateKbOpen}
        onSubmit={handleCreateKb}
        isSubmitting={isCreating}
      />

      {/* Folder Manager */}
      <FolderManager
        folders={folders}
        onCreateFolder={onCreateFolder}
        onUpdateFolder={onUpdateFolder}
        onDeleteFolder={onDeleteFolder}
      />

      {/* Knowledge Base List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">読み込み中...</div>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm font-medium mb-1">まだありません</p>
          <p className="text-xs">「新規」ボタンで作成しましょう</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Folders */}
          {folders.map((folder) => (
            <Collapsible
              key={folder.id}
              open={expandedFolders.has(folder.id)}
              onOpenChange={() => toggleFolder(folder.id)}
            >
              <div className="flex items-center gap-1 group">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start gap-2 h-10 px-3"
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder
                      className="h-4 w-4"
                      style={{ color: folder.color || "#6366f1" }}
                    />
                    <span className="truncate">{folder.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {kbsInFolder(folder.id).length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <FolderItemMenu
                  folder={folder}
                  onEdit={(f) => onUpdateFolder(f.id, { name: f.name, color: f.color })}
                  onDelete={(id) => onDeleteFolder(id)}
                />
              </div>
              <CollapsibleContent>
                <div className="ml-4 pl-2 border-l border-border space-y-1 mt-1">
                  {kbsInFolder(folder.id).map((kb) => (
                    <KnowledgeBaseItem
                      key={kb.id}
                      kb={kb}
                      isSelected={selectedKbId === kb.id}
                      onSelect={() => onSelectKb(kb.id)}
                      onDelete={() => handleDelete(kb.id)}
                      folders={folders}
                      onMoveToFolder={onMoveToFolder}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {/* Knowledge bases without folder */}
          {kbsWithoutFolder.map((kb) => (
            <KnowledgeBaseItem
              key={kb.id}
              kb={kb}
              isSelected={selectedKbId === kb.id}
              onSelect={() => onSelectKb(kb.id)}
              onDelete={() => handleDelete(kb.id)}
              folders={folders}
              onMoveToFolder={onMoveToFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
