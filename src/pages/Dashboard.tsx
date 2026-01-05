import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus, Loader2, ArrowRight, Phone, BookOpen, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAgents } from "@/hooks/useAgents";
import { useConversations } from "@/hooks/useConversations";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";

export default function Dashboard() {
  const { agents, isLoading: isLoadingAgents } = useAgents();
  const { conversations, isLoading: isLoadingConversations } = useConversations();

  const publishedAgents = agents?.filter(a => a.status === "published") || [];
  const recentAgents = agents?.slice(0, 4) || [];
  const hasAgents = agents && agents.length > 0;

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayConversations = conversations?.filter(c => 
      new Date(c.started_at) >= today
    ) || [];

    const totalDuration = conversations?.reduce((sum, c) => 
      sum + (c.duration_seconds || 0), 0
    ) || 0;

    const completedCount = conversations?.filter(c => c.status === 'completed').length || 0;
    const successRate = conversations?.length 
      ? Math.round((completedCount / conversations.length) * 100) 
      : 0;

    return {
      todayCount: todayConversations.length,
      successRate,
      totalDuration,
    };
  }, [conversations]);

  return (
    <AppLayout>
      <WelcomeDialog />
      <div className="p-6 md:p-8 lg:p-12 mobile-safe-bottom max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">
            おかえりなさい
          </h1>
          <p className="text-base text-muted-foreground">
            {hasAgents 
              ? "今日のダッシュボード" 
              : "最初のエージェントを作成しましょう"}
          </p>
        </div>

        {/* Empty State */}
        {!isLoadingAgents && !hasAgents && (
          <div className="mb-12">
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-foreground/5 flex items-center justify-center">
                <Bot className="h-8 w-8 text-foreground/60" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                エージェントがありません
              </h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                AIアシスタントを作成して、電話対応を自動化しましょう
              </p>
              <Button asChild size="lg" className="h-12 px-8 rounded-xl">
                <Link to="/agents/new">
                  <Plus className="h-5 w-5 mr-2" />
                  エージェントを作成
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions for New Users */}
        {!isLoadingAgents && !hasAgents && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              { to: "/agents/new", icon: Bot, title: "エージェント作成", primary: true },
              { to: "/knowledge", icon: BookOpen, title: "ナレッジ登録" },
              { to: "/settings", icon: Settings, title: "設定" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 ${
                  item.primary 
                    ? "bg-foreground text-background border-foreground hover:opacity-90" 
                    : "bg-card border-border hover:border-foreground/20"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        {hasAgents && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {[
                { label: "エージェント", value: agents?.length || 0, icon: Bot },
                { label: "公開中", value: publishedAgents.length, icon: Phone },
                { label: "今日の通話", value: stats.todayCount, icon: MessageSquare },
                { label: "成功率", value: `${stats.successRate}%`, icon: ArrowRight },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-muted/30 border border-border"
                >
                  <stat.icon className="h-5 w-5 text-muted-foreground mb-3" />
                  {isLoadingAgents || isLoadingConversations ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Create Button */}
            <div className="mb-12">
              <Button asChild size="lg" className="h-12 px-8 rounded-xl">
                <Link to="/agents/new">
                  <Plus className="h-5 w-5 mr-2" />
                  新しいエージェント
                </Link>
              </Button>
            </div>

            {/* Recent Agents */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">エージェント</h2>
                <Link 
                  to="/agents" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  すべて表示
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {isLoadingAgents ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {recentAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      to={`/agents/${agent.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-all duration-200 group"
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                        agent.status === "published" 
                          ? "bg-foreground text-background" 
                          : "bg-muted text-muted-foreground group-hover:bg-foreground/10"
                      }`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
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
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
