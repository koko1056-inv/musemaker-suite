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
      <div className="p-4 md:p-6 lg:p-8 mobile-safe-bottom max-w-5xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
            こんにちは！👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {hasAgents 
              ? "今日もAIアシスタントを活用しましょう" 
              : "最初のAIアシスタントを作成して始めましょう"}
          </p>
        </div>

        {/* Empty State - First Time User */}
        {!isLoadingAgents && !hasAgents && (
          <div className="mb-6 sm:mb-8">
            <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardContent className="flex flex-col items-center text-center py-8 sm:py-12 px-4 sm:px-6">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 animate-pulse">
                  <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">
                  まだエージェントがありません
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
                  AIアシスタントを作成すると、電話対応や質問への回答を自動化できます。
                </p>
                <p className="text-primary font-medium text-sm sm:text-base mb-4 sm:mb-6">
                  ✨ プログラミングの知識は不要です！
                </p>
                <Button asChild size="lg" className="gap-2 shadow-lg w-full sm:w-auto text-base h-12 sm:h-11">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <ActionCard
              to="/agents/new"
              icon={<Bot className="h-6 w-6" />}
              title="エージェント作成"
              description="AIアシスタントを作る"
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">エージェント数</p>
                      {isLoadingAgents ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-xl sm:text-2xl font-bold">{agents?.length || 0}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">公開中</p>
                      {isLoadingAgents ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-xl sm:text-2xl font-bold">{publishedAgents.length}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">今日の通話</p>
                      {isLoadingConversations ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-xl sm:text-2xl font-bold">{stats.todayCount}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">成功率</p>
                      {isLoadingConversations ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <p className="text-xl sm:text-2xl font-bold">{stats.successRate}%</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Primary Action */}
            <div className="mb-6 sm:mb-8">
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto shadow-lg text-base h-12 sm:h-11">
                <Link to="/agents/new">
                  <Plus className="h-5 w-5" />
                  新しいエージェントを作成
                </Link>
              </Button>
            </div>

            {/* Recent Agents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
                <div>
                  <CardTitle className="text-base sm:text-lg">あなたのエージェント</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">作成したAIアシスタント</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-sm">
                  <Link to="/agents" className="flex items-center gap-1 text-primary">
                    すべて見る
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {isLoadingAgents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {recentAgents.map((agent) => (
                      <Link
                        key={agent.id}
                        to={`/agents/${agent.id}`}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group min-h-[72px]"
                      >
                        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-colors shrink-0 ${
                          agent.status === "published" 
                            ? "bg-green-500/10 text-green-600" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                            <p className="font-medium text-sm sm:text-base truncate">{agent.name}</p>
                            <Badge 
                              variant={agent.status === "published" ? "default" : "secondary"}
                              className="text-xs shrink-0"
                            >
                              {agent.status === "published" ? "公開中" : "下書き"}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
