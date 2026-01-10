import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus, Loader2, ArrowRight, Phone, BookOpen, Settings } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const greetings = [
  "おかえりなさい",
  "今日も一歩、前へ",
  "小さな進歩が大きな変化を生む",
  "継続は力なり",
  "挑戦なくして成長なし",
  "一期一会を大切に",
  "今日という日は二度とこない",
  "失敗は成功のもと",
  "千里の道も一歩から",
  "為せば成る",
  "笑う門には福来る",
  "七転び八起き",
  "石の上にも三年",
  "習うより慣れろ",
  "塵も積もれば山となる",
];

export default function Dashboard() {
  const { stats, recentAgents, hasAgents, isLoading, isLoadingAgents } = useDashboardStats();
  
  const [greeting, setGreeting] = useState(() => 
    greetings[Math.floor(Math.random() * greetings.length)]
  );

  useEffect(() => {
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  // Stats are now provided by useDashboardStats hook

  return (
    <AppLayout>
      <WelcomeDialog />
      <div className="p-4 sm:p-6 md:p-8 lg:p-12 mobile-safe-bottom max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-1 sm:mb-2">
            {greeting}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
              {[
                { label: "エージェント", value: stats.totalAgents, icon: Bot },
                { label: "公開中", value: stats.publishedAgents, icon: Phone },
                { label: "今日の通話", value: stats.todayCount, icon: MessageSquare },
                { label: "成功率", value: `${stats.successRate}%`, icon: ArrowRight },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border"
                >
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mb-2 sm:mb-3" />
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  ) : (
                    <>
                      <p className="text-xl sm:text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Create Button */}
            <div className="mb-8 sm:mb-12">
              <Button asChild size="lg" className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-xl text-sm sm:text-base">
                <Link to="/agents/new">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  新しいエージェント
                </Link>
              </Button>
            </div>

            {/* Recent Agents */}
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold">エージェント</h2>
                <Link 
                  to="/agents" 
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  すべて表示
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </div>

              {isLoadingAgents ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-2 sm:gap-3">
                  {recentAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      to={`/agents/${agent.id}`}
                      className="flex items-start sm:items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-card hover:bg-muted/30 transition-all duration-200 group"
                    >
                      <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-colors shrink-0 overflow-hidden ${
                        agent.icon_name === 'custom' && agent.custom_icon_url
                          ? ''
                          : agent.status === "published" 
                            ? "bg-foreground text-background" 
                            : "bg-muted text-muted-foreground group-hover:bg-foreground/10"
                      }`} style={agent.icon_name !== 'custom' && agent.icon_color ? { backgroundColor: agent.icon_color } : undefined}>
                        {agent.icon_name === 'custom' && agent.custom_icon_url ? (
                          <img 
                            src={agent.custom_icon_url} 
                            alt={agent.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (() => {
                          const iconName = agent.icon_name || 'Bot';
                          const IconComponent = (LucideIcons as unknown as Record<string, typeof Bot>)[iconName] || Bot;
                          return <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-medium text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">{agent.name}</p>
                          <Badge 
                            variant={agent.status === "published" ? "default" : "secondary"}
                            className="text-[10px] sm:text-xs shrink-0"
                          >
                            {agent.status === "published" ? "公開中" : "下書き"}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:truncate">
                          {agent.description || "説明なし"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1 sm:mt-0" />
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
