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

const CATEGORIES = [
  { value: "faq", label: "FAQ" },
  { value: "product", label: "製品情報" },
  { value: "policy", label: "ポリシー" },
  { value: "guide", label: "ガイド" },
  { value: "other", label: "その他" },
];

export default function KnowledgeBase() {
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // Form states
  const [kbName, setKbName] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  const { data: knowledgeBases = [], isLoading: isLoadingKbs } = useKnowledgeBases();
  const { data: knowledgeItems = [], isLoading: isLoadingItems } = useKnowledgeItems(selectedKbId);
  
  const createKb = useCreateKnowledgeBase();
  const deleteKb = useDeleteKnowledgeBase();
  const createItem = useCreateKnowledgeItem();
  const updateItem = useUpdateKnowledgeItem();
  const deleteItem = useDeleteKnowledgeItem();
  const uploadFile = useUploadKnowledgeFile();

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKbId);

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
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Knowledge Base List */}
        <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                ナレッジベース
              </h2>
              <Dialog open={isCreateKbOpen} onOpenChange={setIsCreateKbOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新規ナレッジベース</DialogTitle>
                    <DialogDescription>
                      FAQや製品情報を整理するナレッジベースを作成します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>名前</Label>
                      <Input
                        value={kbName}
                        onChange={(e) => setKbName(e.target.value)}
                        placeholder="例: 製品FAQ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>説明</Label>
                      <Textarea
                        value={kbDescription}
                        onChange={(e) => setKbDescription(e.target.value)}
                        placeholder="このナレッジベースの説明..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateKbOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleCreateKb} disabled={createKb.isPending}>
                      作成
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingKbs ? (
                <div className="p-4 text-center text-muted-foreground">読み込み中...</div>
              ) : knowledgeBases.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">ナレッジベースがありません</p>
                </div>
              ) : (
                knowledgeBases.map((kb) => (
                  <div
                    key={kb.id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedKbId === kb.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedKbId(kb.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{kb.name}</p>
                      {kb.description && (
                        <p
                          className={`text-xs truncate ${
                            selectedKbId === kb.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {kb.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`opacity-0 group-hover:opacity-100 ${
                        selectedKbId === kb.id ? "hover:bg-primary-foreground/10" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKb(kb.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Knowledge Items */}
        <div className="flex-1 flex flex-col">
          {selectedKb ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">{selectedKb.name}</h1>
                    {selectedKb.description && (
                      <p className="text-muted-foreground">{selectedKb.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileUpload}
                      />
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          ファイルアップロード
                        </span>
                      </Button>
                    </label>
                    <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          アイテム追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>新規ナレッジアイテム</DialogTitle>
                          <DialogDescription>
                            FAQや製品情報を追加します
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>タイトル</Label>
                            <Input
                              value={itemTitle}
                              onChange={(e) => setItemTitle(e.target.value)}
                              placeholder="例: 返品ポリシーについて"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>カテゴリ</Label>
                            <Select value={itemCategory} onValueChange={setItemCategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="カテゴリを選択" />
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
                          <div className="space-y-2">
                            <Label>内容</Label>
                            <Textarea
                              value={itemContent}
                              onChange={(e) => setItemContent(e.target.value)}
                              placeholder="ナレッジの内容を入力..."
                              className="min-h-[200px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateItemOpen(false)}>
                            キャンセル
                          </Button>
                          <Button onClick={handleCreateItem} disabled={createItem.isPending}>
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
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {isLoadingItems ? (
                  <div className="text-center text-muted-foreground py-8">読み込み中...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>アイテムがありません</p>
                    <p className="text-sm mt-1">
                      「アイテム追加」ボタンからナレッジを追加してください
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredItems.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                              {item.category && (
                                <Badge variant="secondary" className="mt-1">
                                  {CATEGORIES.find((c) => c.value === item.category)?.label ||
                                    item.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-wrap">
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
                              添付ファイルを表示
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>ナレッジアイテムを編集</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>タイトル</Label>
                      <Input
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>カテゴリ</Label>
                      <Select value={itemCategory} onValueChange={setItemCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="カテゴリを選択" />
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
                    <div className="space-y-2">
                      <Label>内容</Label>
                      <Textarea
                        value={itemContent}
                        onChange={(e) => setItemContent(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleUpdateItem} disabled={updateItem.isPending}>
                      保存
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">ナレッジベースを選択</h2>
                <p>左のリストからナレッジベースを選択するか、新規作成してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
