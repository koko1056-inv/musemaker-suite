import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus, Loader2, ArrowRight, Phone, Sparkles, BookOpen, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAgents } from "@/hooks/useAgents";
import { useConversations } from "@/hooks/useConversations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { ActionCard } from "@/components/ui/action-card";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Dashboard() {
  const { agents, isLoading: isLoadingAgents } = useAgents();
  const { conversations, isLoading: isLoadingConversations } = useConversations();

  const publishedAgents = agents?.filter(a => a.status === "published") || [];
  const recentAgents = agents?.slice(0, 3) || [];
  const hasAgents = agents && agents.length > 0;

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayConversations = conversations?.filter(c => 
      new Date(c.started_at) >= today
    ) || [];

    const totalDuration = conversations?.reduce((sum, c) => 
      sum + (c.duration_seconds || 0), 0
    ) || 0;

    const avgDuration = conversations?.length 
      ? Math.round(totalDuration / conversations.length) 
      : 0;

    const completedCount = conversations?.filter(c => c.status === 'completed').length || 0;
    const successRate = conversations?.length 
      ? Math.round((completedCount / conversations.length) * 100) 
      : 0;

    return {
      todayCount: todayConversations.length,
      avgDuration,
      successRate,
    };
  }, [conversations]);

  return (
    <AppLayout>
      <WelcomeDialog />
      <div className="p-4 md:p-8 mobile-safe-bottom">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            こんにちは！👋
          </h1>
          <p className="text-muted-foreground">
            {hasAgents 
              ? "今日もAIアシスタントを活用しましょう" 
              : "最初のAIアシスタントを作成して始めましょう"}
          </p>
        </div>

        {/* Empty State - First Time User */}
        {!isLoadingAgents && !hasAgents && (
          <div className="mb-8">
            <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardContent className="flex flex-col items-center text-center py-12 px-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  まだエージェントがありません
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  AIアシスタントを作成すると、電話対応や質問への回答を自動化できます。
                  <br />
                  <span className="text-primary font-medium">プログラミングの知識は不要です！</span>
                </p>
                <Button asChild size="lg" className="gap-2 shadow-lg">
                  <Link to="/agents/new">
                    <Sparkles className="h-5 w-5" />
                    最初のエージェントを作成
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions for New Users */}
        {!isLoadingAgents && !hasAgents && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <ActionCard
              to="/agents/new"
              icon={<Bot className="h-6 w-6" />}
              title="エージェント作成"
              description="AIアシスタントを作成する"
              highlight
            />
            <ActionCard
              to="/knowledge"
              icon={<BookOpen className="h-6 w-6" />}
              title="知識を登録"
              description="AIに教える情報を追加"
            />
            <ActionCard
              to="/settings"
              icon={<Settings className="h-6 w-6" />}
              title="設定"
              description="APIキーなどを設定"
            />
          </div>
        )}

        {/* Stats for Existing Users */}
        {hasAgents && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">エージェント</p>
                      {isLoadingAgents ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold">{agents?.length || 0}</p>
                      )}
                    </div>
                    <Bot className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">公開中</p>
                      {isLoadingAgents ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold">{publishedAgents.length}</p>
                      )}
                    </div>
                    <Phone className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">今日の通話</p>
                      {isLoadingConversations ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.todayCount}</p>
                      )}
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">成功率</p>
                      {isLoadingConversations ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold">{stats.successRate}%</p>
                      )}
                    </div>
                    <Sparkles className="h-8 w-8 text-amber-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Primary Action */}
            <div className="mb-8">
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto shadow-lg">
                <Link to="/agents/new">
                  <Plus className="h-5 w-5" />
                  新しいエージェントを作成
                </Link>
              </Button>
            </div>

            {/* Recent Agents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">あなたのエージェント</CardTitle>
                  <CardDescription>作成したAIアシスタント</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/agents" className="flex items-center gap-1 text-primary">
                    すべて見る
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAgents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAgents.map((agent) => (
                      <Link
                        key={agent.id}
                        to={`/agents/${agent.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group"
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                          agent.status === "published" 
                            ? "bg-green-500/10 text-green-600" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          <Bot className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{agent.name}</p>
                            <Badge 
                              variant={agent.status === "published" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {agent.status === "published" ? "公開中" : "下書き"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {agent.description || "説明なし"}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
