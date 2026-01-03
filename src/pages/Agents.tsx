import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Plus,
  Search,
  Bot,
  MoreVertical,
  Circle,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/useAgents";
import { toast } from "sonner";

// Voice name mapping
const voiceNames: Record<string, string> = {
  'EXAVITQu4vr4xnSDxMaL': 'サラ',
  'JBFqnCBsd6RMkjVDRZzb': 'ジョージ',
  'XrExE9yKIg1WjnnlVkGX': 'マチルダ',
  'onwK4e9ZLuTAKqWW03F9': 'ダニエル',
  'pFZP5JQG7iQjIQuC4Bku': 'リリー',
  'rachel': 'レイチェル',
};

export default function Agents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const { agents, isLoading, deleteAgent, createAgent } = useAgents();

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

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
      });
      toast.success('エージェントを複製しました');
      navigate(`/agents/${newAgent.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">エージェント</h1>
            <p className="mt-1 text-muted-foreground">
              音声AIエージェントを作成・管理
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/agents/new">
              <Plus className="h-4 w-4" />
              エージェント作成
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="エージェントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Agent Grid */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="glass rounded-xl card-shadow transition-all duration-200 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={agent.status === "published" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        <Circle
                          className={`h-1.5 w-1.5 ${
                            agent.status === "published"
                              ? "fill-primary-foreground"
                              : "fill-muted-foreground"
                          }`}
                        />
                        {agent.status === "published" ? "公開中" : "下書き"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/agents/${agent.id}`} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(agent)}>
                            <Copy className="mr-2 h-4 w-4" />
                            複製
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            埋め込みコード取得
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteAgentId(agent.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <Link to={`/agents/${agent.id}`}>
                    <h3 className="mb-1 font-semibold text-foreground hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                  </Link>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {agent.description || '説明なし'}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-muted-foreground">音声: </span>
                        <span className="font-medium text-foreground">
                          {voiceNames[agent.voice_id] || agent.voice_id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Create New Card */}
            <Link
              to="/agents/new"
              className="glass rounded-xl card-shadow border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 animate-fade-in flex items-center justify-center min-h-[240px]"
              style={{ animationDelay: `${filteredAgents.length * 50}ms` }}
            >
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <p className="font-medium text-foreground">新規エージェント作成</p>
                <p className="text-sm text-muted-foreground">数分で音声AIを構築</p>
              </div>
            </Link>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>エージェントを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。エージェントとその設定が完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
