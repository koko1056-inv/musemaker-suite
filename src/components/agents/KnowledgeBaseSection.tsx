import { useState, useCallback, useMemo } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  BookOpen,
  FileText,
  Search,
  FolderOpen,
  ChevronLeft,
  MoreHorizontal,
  Folder,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  useKnowledgeBases,
  useKnowledgeItems,
  useCreateKnowledgeBase,
  useDeleteKnowledgeBase,
  useCreateKnowledgeItem,
  useUpdateKnowledgeItem,
  useDeleteKnowledgeItem,
  useUploadKnowledgeFile,
  KnowledgeItem,
} from "@/hooks/useKnowledgeBase";
import { useKnowledgeBaseFolders, KnowledgeBaseFolder } from "@/hooks/useKnowledgeBaseFolders";
import { FolderManager, FolderItemMenu } from "@/components/agents/FolderManager";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KnowledgeItemCard } from "@/components/agents/KnowledgeItemCard";
import { FileUploadButton } from "@/components/agents/FileUploadButton";

const CATEGORIES = [
  { value: "faq", label: "FAQ" },
  { value: "product", label: "製品情報" },
  { value: "policy", label: "ポリシー" },
  { value: "guide", label: "ガイド" },
  { value: "other", label: "その他" },
];

interface KnowledgeBaseItemProps {
  kb: { id: string; name: string; description: string | null };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  folders: KnowledgeBaseFolder[];
  onMoveToFolder: (kbId: string, folderId: string | null) => void;
}

function KnowledgeBaseItem({ kb, isSelected, onSelect, onDelete, folders, onMoveToFolder }: KnowledgeBaseItemProps) {
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
          <p className={`text-xs truncate ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {kb.description}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className={`opacity-0 group-hover:opacity-100 h-8 w-8 ${isSelected ? "hover:bg-primary-foreground/10" : ""}`}
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
                <DropdownMenuItem key={folder.id} onClick={() => onMoveToFolder(kb.id, folder.id)}>
                  <Folder className="h-4 w-4 mr-2" style={{ color: folder.color || '#6366f1' }} />
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

export function KnowledgeBaseSection() {
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Form states
  const [kbName, setKbName] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [itemTitle, setItemTitle] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  const { data: knowledgeBases = [], isLoading: isLoadingKbs, refetch: refetchKbs } = useKnowledgeBases();
  const { data: knowledgeItems = [], isLoading: isLoadingItems } = useKnowledgeItems(selectedKbId);
  const { folders, createFolder, updateFolder, deleteFolder, moveToFolder } = useKnowledgeBaseFolders();
  
  const createKb = useCreateKnowledgeBase();
  const deleteKb = useDeleteKnowledgeBase();
  const createItem = useCreateKnowledgeItem();
  const updateItem = useUpdateKnowledgeItem();
  const deleteItem = useDeleteKnowledgeItem();
  const uploadFile = useUploadKnowledgeFile();

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKbId);
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const kbsInFolder = (folderId: string) => knowledgeBases.filter((kb: any) => kb.folder_id === folderId);
  const kbsWithoutFolder = knowledgeBases.filter((kb: any) => !kb.folder_id);

  const handleMoveToFolder = async (kbId: string, folderId: string | null) => {
    await moveToFolder(kbId, folderId);
    refetchKbs();
  };

  const filteredItems = knowledgeItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateKb = async () => {
    if (!kbName.trim()) return;
    
    try {
      // Create knowledge base first
      const newKb = await createKb.mutateAsync({ name: kbName, description: kbDescription });
      
      // Upload pending files to the new knowledge base
      if (pendingFiles.length > 0 && newKb) {
        for (const file of pendingFiles) {
          try {
            const result = await uploadFile.mutateAsync(file);
            await createItem.mutateAsync({
              knowledge_base_id: newKb.id,
              title: file.name,
              content: `ファイル: ${file.name}`,
              file_url: result.url,
              file_type: result.type,
              category: "other",
            });
          } catch (err) {
            console.error('Failed to upload file:', file.name, err);
          }
        }
      }
      
      // Reset form
      setKbName("");
      setKbDescription("");
      setPendingFiles([]);
      setIsCreateKbOpen(false);
      
      // Select the new knowledge base to show uploaded files
      if (newKb) {
        setSelectedKbId(newKb.id);
      }
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
    }
  };

  const handleDeleteKb = async (id: string) => {
    if (confirm("このナレッジベースを削除しますか？")) {
      await deleteKb.mutateAsync(id);
      if (selectedKbId === id) setSelectedKbId(null);
    }
  };

  const handleCreateItem = async () => {
    if (!selectedKbId || !itemTitle.trim() || !itemContent.trim()) return;
    await createItem.mutateAsync({
      knowledge_base_id: selectedKbId,
      title: itemTitle,
      content: itemContent,
      category: itemCategory || undefined,
    });
    setItemTitle("");
    setItemContent("");
    setItemCategory("");
    setIsCreateItemOpen(false);
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemContent(item.content);
    setItemCategory(item.category || "");
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !itemTitle.trim() || !itemContent.trim()) return;
    await updateItem.mutateAsync({
      id: editingItem.id,
      knowledge_base_id: editingItem.knowledge_base_id,
      title: itemTitle,
      content: itemContent,
      category: itemCategory || undefined,
      elevenlabs_document_id: editingItem.elevenlabs_document_id,
    });
    setEditingItem(null);
    setItemTitle("");
    setItemContent("");
    setItemCategory("");
    setIsEditItemOpen(false);
  };

  const handleDeleteItem = async (item: KnowledgeItem) => {
    if (confirm("このアイテムを削除しますか？")) {
      await deleteItem.mutateAsync({
        id: item.id,
        knowledge_base_id: item.knowledge_base_id,
        elevenlabs_document_id: item.elevenlabs_document_id,
      });
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!selectedKbId) return;

    try {
      const result = await uploadFile.mutateAsync(file);
      
      await createItem.mutateAsync({
        knowledge_base_id: selectedKbId,
        title: file.name,
        content: `ファイル: ${file.name}`,
        file_url: result.url,
        file_type: result.type,
        category: "other",
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [selectedKbId, uploadFile, createItem]);

  // Mobile: Show list or detail view
  if (selectedKb) {
    return (
      <div className="space-y-4">
        {/* Back button and header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="-ml-2"
            onClick={() => setSelectedKbId(null)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{selectedKb.name}</h3>
            <p className="text-xs text-muted-foreground">{knowledgeItems.length}件のアイテム</p>
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
            onFileSelect={handleFileUpload}
            isUploading={uploadFile.isPending}
            label="PDF"
            className="px-3"
          />
          
          <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-10 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)]">
              <DialogHeader>
                <DialogTitle>アイテム追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>タイトル</Label>
                  <Input
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="例: 返品ポリシーについて"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>内容</Label>
                  <Textarea
                    value={itemContent}
                    onChange={(e) => setItemContent(e.target.value)}
                    placeholder="AIに教えたい情報を入力..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>カテゴリ</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
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
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button onClick={handleCreateItem} disabled={createItem.isPending} className="w-full">
                  追加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-4">アイテムがありません</p>
              <div className="flex items-center justify-center gap-2">
                <FileUploadButton
                  onFileSelect={handleFileUpload}
                  isUploading={uploadFile.isPending}
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

        {/* Edit Item Dialog */}
        <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle>アイテム編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>タイトル</Label>
                <Input
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>内容</Label>
                <Textarea
                  value={itemContent}
                  onChange={(e) => setItemContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>カテゴリ</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
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
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button onClick={handleUpdateItem} disabled={updateItem.isPending} className="w-full">
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
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
            <p className="text-xs text-muted-foreground">{knowledgeBases.length}件・選択して追加/アップロード</p>
          </div>
        </div>
        <Dialog open={isCreateKbOpen} onOpenChange={setIsCreateKbOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              新規
            </Button>
          </DialogTrigger>
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
                  value={kbName}
                  onChange={(e) => setKbName(e.target.value)}
                  placeholder="例: 製品FAQ"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>説明（任意）</Label>
                <Textarea
                  value={kbDescription}
                  onChange={(e) => setKbDescription(e.target.value)}
                  placeholder="何を保存するか..."
                />
              </div>
              
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>ファイルを追加（任意）</Label>
                <div className="flex items-center gap-2">
                  <FileUploadButton
                    onFileSelect={(file) => setPendingFiles(prev => [...prev, file])}
                    isUploading={false}
                    label="PDFを選択"
                    className="flex-1"
                  />
                </div>
                {pendingFiles.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                        <span className="truncate flex-1">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">{pendingFiles.length}件のファイルを追加予定</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button 
                onClick={handleCreateKb} 
                disabled={createKb.isPending || uploadFile.isPending} 
                className="w-full"
              >
                {(createKb.isPending || uploadFile.isPending) ? "作成中..." : pendingFiles.length > 0 ? `作成 (${pendingFiles.length}件アップロード)` : "作成"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folder Manager */}
      <FolderManager
        folders={folders}
        onCreateFolder={createFolder}
        onUpdateFolder={updateFolder}
        onDeleteFolder={deleteFolder}
      />

      {/* Knowledge Base List */}
      {isLoadingKbs ? (
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
                  <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 h-10 px-3">
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4" style={{ color: folder.color || '#6366f1' }} />
                    <span className="truncate">{folder.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {kbsInFolder(folder.id).length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <FolderItemMenu
                  folder={folder}
                  onEdit={(f) => updateFolder(f.id, { name: f.name, color: f.color })}
                  onDelete={(id) => deleteFolder(id)}
                />
              </div>
              <CollapsibleContent>
                <div className="ml-4 pl-2 border-l border-border space-y-1 mt-1">
                  {kbsInFolder(folder.id).map((kb) => (
                    <KnowledgeBaseItem
                      key={kb.id}
                      kb={kb}
                      isSelected={selectedKbId === kb.id}
                      onSelect={() => setSelectedKbId(kb.id)}
                      onDelete={() => handleDeleteKb(kb.id)}
                      folders={folders}
                      onMoveToFolder={handleMoveToFolder}
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
              onSelect={() => setSelectedKbId(kb.id)}
              onDelete={() => handleDeleteKb(kb.id)}
              folders={folders}
              onMoveToFolder={handleMoveToFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
