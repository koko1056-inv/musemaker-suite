import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAgents } from "@/hooks/useAgents";
import { useConversations } from "@/hooks/useConversations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { agents, isLoading: isLoadingAgents } = useAgents();
  const { conversations, isLoading: isLoadingConversations } = useConversations();

  const publishedAgents = agents?.filter(a => a.status === "published") || [];
  const recentAgents = agents?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ダッシュボード</h1>
            <p className="mt-1 text-muted-foreground">
              音声エージェントの概要
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/agents/new">
              <Plus className="h-4 w-4" />
              エージェント作成
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                総エージェント数
              </CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingAgents ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold">{agents?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                公開中: {publishedAgents.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                会話数
              </CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingConversations ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold">{conversations?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                全期間
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                クイックアクション
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link to="/agents/new">
                  <Plus className="h-4 w-4" />
                  新しいエージェントを作成
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link to="/agents">
                  <Bot className="h-4 w-4" />
                  エージェント一覧を表示
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近のエージェント</CardTitle>
              <CardDescription>作成したエージェント一覧</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agents" className="flex items-center gap-1">
                すべて表示
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentAgents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  まだエージェントがありません
                </p>
                <Button asChild>
                  <Link to="/agents/new">
                    <Plus className="h-4 w-4 mr-2" />
                    最初のエージェントを作成
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {recentAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/50 -mx-4 px-4 rounded-lg"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agent.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {agent.description || "説明なし"}
                      </p>
                    </div>
                    <Badge variant={agent.status === "published" ? "default" : "secondary"}>
                      {agent.status === "published" ? "公開中" : "下書き"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
