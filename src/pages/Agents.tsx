import { useState } from "react";
import headsetIcon from "@/assets/headset-icon.png";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Clock,
  Mic,
  MessageSquare,
  ArrowRight,
  Trash2,
  BookOpen,
  Filter,
  CheckCircle2,
  FileEdit,
  LayoutGrid,
  LayoutList,
  Building2,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents } from "@/hooks/useAgents";
import { useAgentFolders } from "@/hooks/useAgentFolders";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { useWorkspace } from "@/hooks/useWorkspace";
import { FolderManager } from "@/components/agents/FolderManager";
import { KnowledgeBaseSection } from "@/components/agents/KnowledgeBaseSection";
import { PixelAgentCard } from "@/components/agents/PixelAgentCard";
import { AgentListView } from "@/components/agents/AgentListView";
import { FolderSection } from "@/components/agents/FolderSection";
import { OfficeFloorView } from "@/components/agents/OfficeFloorView";
import { GlassIcon } from "@/components/ui/glass-icon";
import { toast } from "sonner";

export default function Agents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"agents" | "knowledge">("agents");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "office">("office");
  
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
    return matchesSearch && matchesStatus;
  });

  // Group agents by folder
  const agentsWithoutFolder = filteredAgents.filter(a => !a.folder_id);
  const agentsByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = filteredAgents.filter(a => a.folder_id === folder.id);
    return acc;
  }, {} as Record<string, typeof agents>);

  // Calculate stats
  const activeAgents = agents.filter(a => a.status === 'published' && a.elevenlabs_agent_id).length;
  const agentsWithPhone = agents.filter(a => phoneNumbers.some(p => p.agent_id === a.id)).length;

  // Inline stats bar counts (match AgentListView status logic)
  const statCallable = agents.filter(a =>
    a.status === 'published' && !!a.elevenlabs_agent_id && phoneNumbers.some(p => p.agent_id === a.id)
  ).length;
  const statActive = agents.filter(a =>
    a.status === 'published' && !!a.elevenlabs_agent_id && !phoneNumbers.some(p => p.agent_id === a.id)
  ).length;
  const statReady = agents.filter(a =>
    a.status === 'published' && !a.elevenlabs_agent_id
  ).length;
  const statDraft = agents.filter(a => a.status !== 'published').length;

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

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mobile-safe-bottom">
          {/* Page header */}
          <div className="mb-5 sm:mb-6">
            {/* Title row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 shrink-0 overflow-hidden">
                <img src={headsetIcon} alt="Headset" className="h-7 w-7 object-contain" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                エージェント
                {agents.length > 0 && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({agents.length})
                  </span>
                )}
              </h1>
            </div>

            {/* Controls row: search · filter · view · new */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="エージェントを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 h-9 text-sm bg-background"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="検索をクリア"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status filter */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg shrink-0">
                  <Button
                    variant={statusFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className="text-xs h-7 px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">すべて</span>
                    <span className="sm:hidden">全</span>
                  </Button>
                  <Button
                    variant={statusFilter === "published" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("published")}
                    className="gap-1 text-xs h-7 px-2 sm:px-3"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="hidden sm:inline">公開中</span>
                  </Button>
                  <Button
                    variant={statusFilter === "draft" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("draft")}
                    className="gap-1 text-xs h-7 px-2 sm:px-3"
                  >
                    <FileEdit className="h-3 w-3" />
                    <span className="hidden sm:inline">下書き</span>
                  </Button>
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg shrink-0" role="group" aria-label="表示切り替え">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-7 w-7 p-0"
                    title="リスト表示"
                    aria-label="リスト表示"
                    aria-pressed={viewMode === "list"}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 w-7 p-0"
                    title="グリッド表示"
                    aria-label="グリッド表示"
                    aria-pressed={viewMode === "grid"}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "office" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("office")}
                    className="h-7 w-7 p-0"
                    title="オフィス表示"
                    aria-label="オフィス表示"
                    aria-pressed={viewMode === "office"}
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                </div>

                <FolderManager
                  folders={folders}
                  onCreateFolder={createFolder}
                  onUpdateFolder={updateFolder}
                  onDeleteFolder={deleteFolder}
                />

                {/* Create button */}
                <Button
                  asChild
                  size="sm"
                  className="gap-1.5 h-9 px-3 bg-foreground text-background hover:bg-foreground/90 shrink-0 hidden sm:flex"
                >
                  <Link to="/agents/new">
                    <Plus className="h-4 w-4" />
                    新規作成
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            {agents.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {statCallable > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-foreground font-medium">{statCallable}</span>
                    通話可能
                  </span>
                )}
                {statActive > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-foreground font-medium">{statActive}</span>
                    稼働中
                  </span>
                )}
                {statReady > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-foreground font-medium">{statReady}</span>
                    準備中
                  </span>
                )}
                {statDraft > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-foreground font-medium">{statDraft}</span>
                    下書き
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mobile Tabs — underline style */}
          <div className="lg:hidden mb-5 border-b border-border">
            <div className="flex">
              <button
                onClick={() => setMobileTab("agents")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  mobileTab === "agents"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <span className="text-base leading-none">🤖</span>
                エージェント
                {agents.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    mobileTab === "agents"
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {agents.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileTab("knowledge")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  mobileTab === "knowledge"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                ナレッジ
              </button>
            </div>
          </div>

          {/* Mobile floating create button — visible on agents tab */}
          {mobileTab === "agents" && (
            <div className="lg:hidden fixed bottom-6 right-4 z-40">
              <Button
                asChild
                size="lg"
                className="gap-2 shadow-xl rounded-full h-14 px-5 bg-foreground text-background hover:bg-foreground/90"
              >
                <Link to="/agents/new">
                  <Plus className="h-5 w-5" />
                  新規作成
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Knowledge Tab Content */}
          {mobileTab === "knowledge" && (
            <div className="lg:hidden">
              <KnowledgeBaseSection />
            </div>
          )}

          {/* Agent Content - Show on desktop always, mobile only when agents tab is active */}
          <div className={`${mobileTab === "knowledge" ? "hidden lg:block" : ""}`}>
            

            {/* Results count */}
            {(searchQuery || statusFilter !== "all") && (
              <p className="mb-4 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                {filteredAgents.length}件のエージェントが見つかりました
              </p>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4">
                {/* Stats skeleton */}
                <div className="flex gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-20" />
                  ))}
                </div>
                {/* Cards skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : agents.length === 0 ? (
              /* Empty State */
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

                {/* Steps with visual numbered circles */}
                <div className="flex flex-col sm:flex-row items-center gap-3 my-8">
                  {[
                    { num: 1, label: "名前を決める" },
                    { num: 2, label: "声を選ぶ" },
                    { num: 3, label: "テスト通話" },
                  ].map((step, i, arr) => (
                    <div key={step.num} className="flex items-center gap-3">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/60">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold shadow-sm">
                          {step.num}
                        </div>
                        <span className="text-sm font-medium">{step.label}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  size="lg"
                  className="gap-2 shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Link to="/agents/new">
                    <Plus className="h-5 w-5" />
                    エージェントを作成する
                  </Link>
                </Button>

                {/* Feature highlights */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
                  <div className="text-center p-6 rounded-xl bg-muted/30 border border-border">
                    <GlassIcon icon={Mic} size="2xl" variant="primary" className="mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">自然な音声</h3>
                    <p className="text-sm text-muted-foreground">
                      人間のような自然な声で会話します
                    </p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-muted/30 border border-border">
                    <GlassIcon icon={MessageSquare} size="2xl" variant="info" className="mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">スマートな応答</h3>
                    <p className="text-sm text-muted-foreground">
                      AIがお客様の質問に適切に回答
                    </p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-muted/30 border border-border">
                    <GlassIcon icon={Clock} size="2xl" variant="success" className="mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">24時間対応</h3>
                    <p className="text-sm text-muted-foreground">
                      深夜や休日も自動で応対します
                    </p>
                  </div>
                </div>
              </div>
            ) : viewMode === "office" ? (
              /* Office Floor View */
              <OfficeFloorView
                agents={filteredAgents}
                folders={folders}
                phoneNumbers={phoneNumbers}
                getAgentPhoneNumber={getAgentPhoneNumber}
                onPhoneAssign={handlePhoneAssign}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteAgentId}
                onMoveToFolder={handleMoveToFolder}
              />
            ) : viewMode === "list" ? (
              /* List View */
              <div className="space-y-6">
                {/* All agents in list format */}
                <AgentListView
                  agents={filteredAgents}
                  phoneNumbers={phoneNumbers}
                  folders={folders}
                  getAgentPhoneNumber={getAgentPhoneNumber}
                  onPhoneAssign={handlePhoneAssign}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteAgentId}
                  onMoveToFolder={handleMoveToFolder}
                />
                
                {/* Create New Button */}
                <Link
                  to="/agents/new"
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">新しいエージェント</p>
                    <p className="text-xs text-muted-foreground">クリックして作成</p>
                  </div>
                </Link>
              </div>
            ) : (
              /* Grid View with folders */
              <div className="space-y-4">
                {/* Folders first */}
                {folders.map(folder => (
                  <FolderSection
                    key={folder.id}
                    folder={folder}
                    agents={agentsByFolder[folder.id] || []}
                    allFolders={folders}
                    phoneNumbers={phoneNumbers}
                    defaultOpen={true}
                    onPhoneAssign={handlePhoneAssign}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeleteAgentId}
                    onMoveToFolder={handleMoveToFolder}
                    getAgentPhoneNumber={getAgentPhoneNumber}
                  />
                ))}

                {/* Agents without folder */}
                {agentsWithoutFolder.length > 0 && (
                  <div>
                    {folders.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="text-sm font-medium text-muted-foreground">フォルダなし</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {agentsWithoutFolder.length}件
                        </span>
                      </div>
                    )}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {agentsWithoutFolder.map((agent, index) => (
                        <PixelAgentCard
                          key={agent.id}
                          agent={agent}
                          index={index}
                          phoneNumbers={phoneNumbers}
                          folders={folders}
                          assignedPhone={getAgentPhoneNumber(agent.id)}
                          onPhoneAssign={handlePhoneAssign}
                          onDuplicate={handleDuplicate}
                          onDelete={setDeleteAgentId}
                          onMoveToFolder={handleMoveToFolder}
                        />
                      ))}
                      
                      {/* Create New Card */}
                      <Link
                        to="/agents/new"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[200px] group"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-3">
                          <Plus className="h-7 w-7" />
                        </div>
                        <p className="font-semibold text-foreground mb-1">新しいエージェント</p>
                        <p className="text-xs text-muted-foreground">
                          クリックして作成
                        </p>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Show create card when only folders exist with no loose agents */}
                {agentsWithoutFolder.length === 0 && folders.length > 0 && (
                  <Link
                    to="/agents/new"
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[160px] group max-w-sm"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-3">
                      <Plus className="h-7 w-7" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">新しいエージェント</p>
                    <p className="text-xs text-muted-foreground">
                      クリックして作成
                    </p>
                  </Link>
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
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
