import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  Edit,
  Search,
  FolderOpen,
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
import { useKnowledgeBaseFolders } from "@/hooks/useKnowledgeBaseFolders";
import { FolderManager, FolderItemMenu } from "@/components/agents/FolderManager";
import { Folder, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { KnowledgeBaseFolder } from "@/hooks/useKnowledgeBaseFolders";
import { MoreHorizontal } from "lucide-react";

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

export default function KnowledgeBase() {
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
    await createKb.mutateAsync({ name: kbName, description: kbDescription });
    setKbName("");
    setKbDescription("");
    setIsCreateKbOpen(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedKbId) return;

    const result = await uploadFile.mutateAsync(file);
    
    // Create item from file
    await createItem.mutateAsync({
      knowledge_base_id: selectedKbId,
      title: file.name,
      content: `ファイル: ${file.name}`,
      file_url: result.url,
      file_type: result.type,
      category: "other",
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] lg:h-screen">
        {/* Sidebar - Knowledge Base List */}
        <div className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-muted/30 flex flex-col ${selectedKb ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                ナレッジベース
              </h2>
              <Dialog open={isCreateKbOpen} onOpenChange={setIsCreateKbOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9">
                    <Plus className="h-4 w-4 mr-1" />
                    新規
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">新規ナレッジベース</DialogTitle>
                    <DialogDescription className="text-sm">
                      FAQや製品情報を整理するフォルダを作成します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm">名前</Label>
                      <Input
                        value={kbName}
                        onChange={(e) => setKbName(e.target.value)}
                        placeholder="例: 製品FAQ"
                        className="h-11 sm:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">説明（任意）</Label>
                      <Textarea
                        value={kbDescription}
                        onChange={(e) => setKbDescription(e.target.value)}
                        placeholder="何を保存するか..."
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsCreateKbOpen(false)} className="w-full sm:w-auto">
                      キャンセル
                    </Button>
                    <Button onClick={handleCreateKb} disabled={createKb.isPending} className="w-full sm:w-auto">
                      作成
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              AIに教える情報をここに登録します
            </p>
            <div className="mt-3">
              <FolderManager
                folders={folders}
                onCreateFolder={createFolder}
                onUpdateFolder={updateFolder}
                onDeleteFolder={deleteFolder}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingKbs ? (
                <div className="p-4 text-center text-muted-foreground text-sm">読み込み中...</div>
              ) : knowledgeBases.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm font-medium mb-1">まだありません</p>
                  <p className="text-xs">「新規」ボタンで作成しましょう</p>
                </div>
              ) : (
                <>
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
                  {kbsWithoutFolder.length > 0 && (
                    <div className="space-y-1">
                      {folders.length > 0 && (
                        <p className="text-xs text-muted-foreground px-3 py-2">フォルダなし</p>
                      )}
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
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Knowledge Items */}
        <div className={`flex-1 flex flex-col ${!selectedKb ? 'hidden lg:flex' : 'flex'}`}>
          {selectedKb ? (
            <>
              <div className="p-4 border-b border-border">
                {/* Mobile Back Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden mb-3 -ml-2"
                  onClick={() => setSelectedKbId(null)}
                >
                  ← 一覧に戻る
                </Button>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold">{selectedKb.name}</h1>
                    {selectedKb.description && (
                      <p className="text-sm text-muted-foreground">{selectedKb.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 sm:flex-none">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileUpload}
                      />
                      <Button variant="outline" asChild className="w-full sm:w-auto h-10">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          ファイル
                        </span>
                      </Button>
                    </label>
                    <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 sm:flex-none h-10">
                          <Plus className="h-4 w-4 mr-2" />
                          追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">新規ナレッジアイテム</DialogTitle>
                          <DialogDescription className="text-sm">
                            AIに教える情報を追加します
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-sm">タイトル</Label>
                            <Input
                              value={itemTitle}
                              onChange={(e) => setItemTitle(e.target.value)}
                              placeholder="例: 返品ポリシーについて"
                              className="h-11 sm:h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">カテゴリ</Label>
                            <Select value={itemCategory} onValueChange={setItemCategory}>
                              <SelectTrigger className="h-11 sm:h-10">
                                <SelectValue placeholder="カテゴリを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value} className="py-3 sm:py-2">
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">内容</Label>
                            <Textarea
                              value={itemContent}
                              onChange={(e) => setItemContent(e.target.value)}
                              placeholder="ナレッジの内容を入力..."
                              className="min-h-[150px] sm:min-h-[200px] text-sm"
                            />
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                          <Button variant="outline" onClick={() => setIsCreateItemOpen(false)} className="w-full sm:w-auto">
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateItem} disabled={createItem.isPending} className="w-full sm:w-auto">
                            追加
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ナレッジを検索..."
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {isLoadingItems ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">読み込み中...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6 opacity-50" />
                    </div>
                    <p className="font-medium text-sm">アイテムがありません</p>
                    <p className="text-xs mt-1">
                      「追加」ボタンからナレッジを登録しましょう
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="pb-2 px-4 sm:px-6 pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base sm:text-lg truncate">{item.title}</CardTitle>
                              {item.category && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {CATEGORIES.find((c) => c.value === item.category)?.label ||
                                    item.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                          <p className="text-muted-foreground whitespace-pre-wrap text-sm line-clamp-4">
                            {item.content}
                          </p>
                          {item.file_url && (
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-sm mt-2 inline-flex items-center gap-1 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              添付ファイル
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Edit Dialog */}
              <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
                <DialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">ナレッジアイテムを編集</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm">タイトル</Label>
                      <Input
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        className="h-11 sm:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">カテゴリ</Label>
                      <Select value={itemCategory} onValueChange={setItemCategory}>
                        <SelectTrigger className="h-11 sm:h-10">
                          <SelectValue placeholder="カテゴリを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="py-3 sm:py-2">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">内容</Label>
                      <Textarea
                        value={itemContent}
                        onChange={(e) => setItemContent(e.target.value)}
                        className="min-h-[150px] sm:min-h-[200px] text-sm"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsEditItemOpen(false)} className="w-full sm:w-auto">
                      キャンセル
                    </Button>
                    <Button onClick={handleUpdateItem} disabled={updateItem.isPending} className="w-full sm:w-auto">
                      保存
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
              <div className="text-center max-w-sm">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 opacity-50" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">ナレッジベースを選択</h2>
                <p className="text-sm">左のリストから選択するか、「新規」ボタンで作成してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
