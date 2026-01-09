import { useState } from "react";
import headsetIcon from "@/assets/headset-icon.png";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Bot,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Loader2,
  Sparkles,
  Phone,
  Clock,
  CheckCircle2,
  FileEdit,
  Mic,
  MessageSquare,
  ArrowRight,
  Folder,
  FolderOpen,
  ChevronRight,
  FolderInput,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/useAgents";
import { useAgentFolders } from "@/hooks/useAgentFolders";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { useWorkspace } from "@/hooks/useWorkspace";
import { FolderManager } from "@/components/agents/FolderManager";
import { toast } from "sonner";

// Voice name mapping with friendly descriptions
const voiceData: Record<string, { name: string; description: string }> = {
  'EXAVITQu4vr4xnSDxMaL': { name: 'サラ', description: '落ち着いた女性の声' },
  'JBFqnCBsd6RMkjVDRZzb': { name: 'ジョージ', description: '信頼感のある男性の声' },
  'XrExE9yKIg1WjnnlVkGX': { name: 'マチルダ', description: '明るい女性の声' },
  'onwK4e9ZLuTAKqWW03F9': { name: 'ダニエル', description: 'プロフェッショナルな男性の声' },
  'pFZP5JQG7iQjIQuC4Bku': { name: 'リリー', description: '親しみやすい女性の声' },
  'rachel': { name: 'レイチェル', description: 'ナチュラルな女性の声' },
};

export default function Agents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const { workspace } = useWorkspace();
  const { agents, isLoading, deleteAgent, createAgent, moveToFolder } = useAgents();
  const { folders, createFolder, updateFolder, deleteFolder } = useAgentFolders();
  const { phoneNumbers, assignToAgent, unassignFromAgent } = usePhoneNumbers(workspace?.id);

  // Get phone number for an agent
  const getAgentPhoneNumber = (agentId: string) => {
    return phoneNumbers.find(p => p.agent_id === agentId);
  };

  // Handle phone number assignment
  const handlePhoneAssign = async (agentId: string, phoneNumberSid: string) => {
    if (phoneNumberSid === "none") {
      const current = phoneNumbers.find(p => p.agent_id === agentId);
      if (current) {
        await unassignFromAgent(current.phone_number_sid);
      }
    } else {
      await assignToAgent(phoneNumberSid, agentId);
    }
  };

  // Filter agents based on search and status
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    const matchesFolder = selectedFolderId === null || agent.folder_id === selectedFolderId;
    return matchesSearch && matchesStatus && matchesFolder;
  });

  // Group agents by folder
  const agentsWithoutFolder = filteredAgents.filter(a => !a.folder_id);
  const agentsByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = filteredAgents.filter(a => a.folder_id === folder.id);
    return acc;
  }, {} as Record<string, typeof agents>);

  const handleDelete = async () => {
    if (!deleteAgentId) return;
    try {
      await deleteAgent(deleteAgentId);
    } finally {
      setDeleteAgentId(null);
    }
  };

  const handleDuplicate = async (agent: typeof agents[0]) => {
    try {
      const newAgent = await createAgent({
        name: `${agent.name} (コピー)`,
        description: agent.description,
        voice_id: agent.voice_id,
        voice_style: agent.voice_style,
        voice_speed: agent.voice_speed,
        status: 'draft',
        max_call_duration: agent.max_call_duration,
        welcome_timeout: agent.welcome_timeout,
        fallback_behavior: agent.fallback_behavior,
        folder_id: agent.folder_id,
      });
      toast.success('エージェントを複製しました');
      navigate(`/agents/${newAgent.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleMoveToFolder = async (agentId: string, folderId: string | null) => {
    await moveToFolder(agentId, folderId);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getVoiceInfo = (voiceId: string) => {
    return voiceData[voiceId] || { name: voiceId, description: '' };
  };

  // Agent Card Component
  const AgentCard = ({ agent, index }: { agent: typeof agents[0]; index: number }) => {
    const voiceInfo = getVoiceInfo(agent.voice_id);
    const isPublished = agent.status === "published";
    const isReady = !!agent.elevenlabs_agent_id;
    const assignedPhone = getAgentPhoneNumber(agent.id);

    return (
      <div
        className="glass rounded-xl card-shadow transition-all duration-200 hover:shadow-lg hover:border-primary/30 animate-fade-in group"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-colors shrink-0 ${
                isPublished ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
              }`}>
                <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/agents/${agent.id}`}>
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 text-sm sm:text-base">
                    {agent.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                  <Badge
                    variant={isPublished ? "default" : "secondary"}
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                  >
                    {isPublished ? "公開中" : "下書き"}
                  </Badge>
                  {isReady && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 px-1.5 sm:px-2">
                      通話可能
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/agents/${agent.id}`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    編集する
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(agent)}>
                  <Copy className="mr-2 h-4 w-4" />
                  コピーを作成
                </DropdownMenuItem>
                {folders.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderInput className="mr-2 h-4 w-4" />
                        フォルダに移動
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {agent.folder_id && (
                          <DropdownMenuItem onClick={() => handleMoveToFolder(agent.id, null)}>
                            <Folder className="mr-2 h-4 w-4" />
                            フォルダから削除
                          </DropdownMenuItem>
                        )}
                        {folders.map(folder => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={() => handleMoveToFolder(agent.id, folder.id)}
                            disabled={agent.folder_id === folder.id}
                          >
                            <div
                              className="mr-2 h-4 w-4 rounded-sm"
                              style={{ backgroundColor: folder.color }}
                            />
                            {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteAgentId(agent.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除する
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4 min-h-[2rem] sm:min-h-[2.5rem]">
            {agent.description || '説明が設定されていません'}
          </p>

          {/* Voice Info */}
          <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/50 mb-3 sm:mb-4">
            <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <div className="text-xs sm:text-sm min-w-0">
              <span className="font-medium text-foreground">{voiceInfo.name}</span>
              {voiceInfo.description && (
                <span className="text-muted-foreground hidden sm:inline"> · {voiceInfo.description}</span>
              )}
            </div>
          </div>

          {/* Phone Number Assignment */}
          {phoneNumbers.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <Select
                value={assignedPhone?.phone_number_sid || "none"}
                onValueChange={(value) => handlePhoneAssign(agent.id, value)}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="電話番号を割り当て">
                      {assignedPhone ? (
                        <span className="font-mono">{assignedPhone.phone_number}</span>
                      ) : (
                        <span className="text-muted-foreground">電話番号を割り当て</span>
                      )}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">未割り当て</span>
                  </SelectItem>
                  {phoneNumbers.map((phone) => (
                    <SelectItem 
                      key={phone.phone_number_sid} 
                      value={phone.phone_number_sid}
                      disabled={phone.agent_id !== null && phone.agent_id !== agent.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{phone.phone_number}</span>
                        {phone.label && (
                          <span className="text-muted-foreground text-xs">({phone.label})</span>
                        )}
                        {phone.agent_id && phone.agent_id !== agent.id && (
                          <span className="text-muted-foreground text-xs">(使用中)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Button */}
          <Button asChild variant="outline" className="w-full gap-2 group/btn h-9 sm:h-10 text-xs sm:text-sm">
            <Link to={`/agents/${agent.id}`}>
              設定を確認
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mobile-safe-bottom">
          {/* Header with welcome message */}
          <div className="mb-5 sm:mb-6 md:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-3 mb-1 sm:mb-2">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-muted/30 shrink-0 overflow-hidden">
                  <img src={headsetIcon} alt="Headset" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">エージェント</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    AIアシスタントを作成・管理
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="gap-2 shadow-lg w-full sm:w-auto h-12 sm:h-11 text-base">
                <Link to="/agents/new">
                  <Sparkles className="h-5 w-5" />
                  新しく作成する
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8">
            <div className="glass rounded-xl p-3 sm:p-4 card-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{agents.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">総数</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 card-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {agents.filter(a => a.status === 'published').length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">公開中</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 card-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <FileEdit className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {agents.filter(a => a.status === 'draft').length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">下書き</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 card-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {agents.filter(a => a.elevenlabs_agent_id).length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">通話可能</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="名前や説明で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs h-8 shrink-0"
              >
                すべて
              </Button>
              <Button
                variant={statusFilter === "published" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("published")}
                className="gap-1 text-xs h-8 shrink-0"
              >
                <CheckCircle2 className="h-3 w-3" />
                公開中
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("draft")}
                className="gap-1 text-xs h-8 shrink-0"
              >
                <FileEdit className="h-3 w-3" />
                下書き
              </Button>
              <div className="ml-auto shrink-0">
                <FolderManager
                  folders={folders}
                  onCreateFolder={createFolder}
                  onUpdateFolder={updateFolder}
                  onDeleteFolder={deleteFolder}
                />
              </div>
            </div>
          </div>

          {/* Folder Filter Pills */}
          {folders.length > 0 && (
            <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <Button
                variant={selectedFolderId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolderId(null)}
                className="h-7 text-xs gap-1 shrink-0"
              >
                <Folder className="h-3 w-3" />
                すべて
              </Button>
              {folders.map(folder => (
                <Button
                  key={folder.id}
                  variant={selectedFolderId === folder.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="h-7 text-xs gap-1 shrink-0"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="truncate max-w-[80px] sm:max-w-none">{folder.name}</span>
                  <span className="text-muted-foreground">
                    ({agents.filter(a => a.folder_id === folder.id).length})
                  </span>
                </Button>
              ))}
            </div>
          )}

          {(searchQuery || statusFilter !== "all") && (
            <p className="mb-4 text-xs sm:text-sm text-muted-foreground">
              {filteredAgents.length}件のエージェントが見つかりました
            </p>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">読み込んでいます...</p>
            </div>
          ) : agents.length === 0 ? (
            /* Empty State - More Friendly */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/30">
                <img src={headsetIcon} alt="Headset" className="h-16 w-16 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                AIアシスタントを作ってみましょう！
              </h2>
              <p className="text-muted-foreground mb-2 max-w-md text-base">
                3つのステップで簡単に作成できます
              </p>
              
              {/* Simple Steps */}
              <div className="flex flex-col sm:flex-row items-center gap-4 my-8">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <span className="text-sm">名前を決める</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <span className="text-sm">声を選ぶ</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <span className="text-sm">テスト通話</span>
                </div>
              </div>

              <Button asChild size="lg" className="gap-2 shadow-lg">
                <Link to="/agents/new">
                  <Sparkles className="h-5 w-5" />
                  エージェントを作成する
                </Link>
              </Button>

              {/* Feature highlights */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
                <div className="text-center p-6 rounded-xl bg-muted/30 border border-border">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Mic className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">自然な音声</h3>
                  <p className="text-sm text-muted-foreground">
                    人間のような自然な声で会話します
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/30 border border-border">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">スマートな応答</h3>
                  <p className="text-sm text-muted-foreground">
                    AIがお客様の質問に適切に回答
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/30 border border-border">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">24時間対応</h3>
                  <p className="text-sm text-muted-foreground">
                    深夜や休日も自動で応対します
                  </p>
                </div>
              </div>
            </div>
          ) : selectedFolderId !== null ? (
            /* Show only selected folder's agents in grid */
            <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
              
              {/* Create New Card */}
              <Link
                to="/agents/new"
                className="glass rounded-xl card-shadow border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 animate-fade-in flex items-center justify-center min-h-[200px] sm:min-h-[280px] group"
                style={{ animationDelay: `${filteredAgents.length * 50}ms` }}
              >
                <div className="text-center p-4 sm:p-6">
                  <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <p className="font-semibold text-foreground mb-1 text-sm sm:text-base">新しいエージェントを作成</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    数分で音声AIを構築できます
                  </p>
                </div>
              </Link>
            </div>
          ) : (
            /* Show folders with collapsible sections */
            <div className="space-y-4 sm:space-y-6">
              {/* Folders */}
              {folders.map(folder => {
                const folderAgents = agentsByFolder[folder.id] || [];
                const isExpanded = expandedFolders.has(folder.id);
                
                return (
                  <Collapsible
                    key={folder.id}
                    open={isExpanded}
                    onOpenChange={() => toggleFolder(folder.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${folder.color}20` }}
                        >
                          {isExpanded ? (
                            <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: folder.color }} />
                          ) : (
                            <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: folder.color }} />
                          )}
                        </div>
                        <span className="font-medium text-foreground text-sm sm:text-base truncate">{folder.name}</span>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                          {folderAgents.length}
                        </Badge>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground ml-auto shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {folderAgents.length === 0 ? (
                        <div className="ml-9 sm:ml-11 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                          このフォルダにはエージェントがありません
                        </div>
                      ) : (
                        <div className="ml-0 sm:ml-11 mt-2 sm:mt-3 grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {folderAgents.map((agent, index) => (
                            <AgentCard key={agent.id} agent={agent} index={index} />
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {/* Agents without folder */}
              {agentsWithoutFolder.length > 0 && (
                <div>
                  {folders.length > 0 && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 mb-2 sm:mb-3">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-muted shrink-0">
                        <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground text-sm sm:text-base">フォルダなし</span>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {agentsWithoutFolder.length}
                      </Badge>
                    </div>
                  )}
                  <div className={`grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${folders.length > 0 ? 'sm:ml-11' : ''}`}>
                    {agentsWithoutFolder.map((agent, index) => (
                      <AgentCard key={agent.id} agent={agent} index={index} />
                    ))}
                    
                    {/* Create New Card */}
                    <Link
                      to="/agents/new"
                      className="glass rounded-xl card-shadow border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 animate-fade-in flex items-center justify-center min-h-[200px] sm:min-h-[280px] group"
                      style={{ animationDelay: `${agentsWithoutFolder.length * 50}ms` }}
                    >
                      <div className="text-center p-4 sm:p-6">
                        <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <p className="font-semibold text-foreground mb-1 text-sm sm:text-base">新しいエージェントを作成</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          数分で音声AIを構築できます
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Show create card when only folders exist with no loose agents */}
              {agentsWithoutFolder.length === 0 && folders.length > 0 && (
                <div className="sm:ml-11">
                  <Link
                    to="/agents/new"
                    className="glass rounded-xl card-shadow border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex items-center justify-center min-h-[160px] sm:min-h-[200px] group max-w-sm"
                  >
                    <div className="text-center p-4 sm:p-6">
                      <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <p className="font-semibold text-foreground mb-1 text-sm sm:text-base">新しいエージェントを作成</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        数分で音声AIを構築できます
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-center">エージェントを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  この操作は取り消せません。<br />
                  エージェントとそのすべての設定が完全に削除されます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-center gap-2">
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
