import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Bot, MessageSquare, Plus, ArrowRight, Phone, BookOpen, Settings, TrendingUp, Users, Mic, Headphones, Shield, Zap, Brain, Heart, Star, Lightbulb, Globe, Cpu, Radio, Smile, Coffee } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { MobileStatsCarousel } from "@/components/dashboard/MobileStatsCarousel";
import { MobileAgentCard } from "@/components/dashboard/MobileAgentCard";
import { MobileEmptyState } from "@/components/dashboard/MobileEmptyState";
import { MobileQuickActions } from "@/components/dashboard/MobileQuickActions";

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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Bot, Phone, BookOpen, Settings, TrendingUp, Users, Mic, MessageSquare, Headphones, Shield, Zap, Brain, Heart, Star, Lightbulb, Globe, Cpu, Radio, Smile, Coffee
};

function DynamicIcon({ name, className, style }: { name?: string | null; className?: string; style?: React.CSSProperties }) {
  const IconComponent = name ? ICON_MAP[name] : null;
  return IconComponent ? <IconComponent className={className} style={style} /> : <Bot className={className} style={style} />;
}

export default function Dashboard() {
  const { stats, recentAgents, hasAgents, isLoading, isLoadingAgents } = useDashboardStats();
  
  const [greeting] = useState(() =>
    greetings[Math.floor(Math.random() * greetings.length)]
  );

  return (
    <AppLayout>
      <WelcomeDialog />
      <div className="p-4 sm:p-6 md:p-8 lg:p-12 mobile-safe-bottom max-w-6xl">
        {/* Mobile Header - Compact */}
        <div className="mb-6 lg:mb-12">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-semibold tracking-tight text-foreground mb-0.5 sm:mb-2">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasAgents 
              ? "今日のダッシュボード" 
              : "最初のエージェントを作成しましょう"}
          </p>
        </div>

        {/* Mobile Empty State */}
        {!isLoadingAgents && !hasAgents && <MobileEmptyState />}

        {/* Desktop Empty State */}
        {!isLoadingAgents && !hasAgents && (
          <div className="hidden lg:block mb-12">
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <div className="mx-auto mb-6">
                <GlassIcon icon={Bot} size="2xl" iconSize="xl" variant="muted" className="mx-auto" />
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

        {/* Desktop Quick Actions for New Users */}
        {!isLoadingAgents && !hasAgents && (
          <div className="hidden lg:grid grid-cols-3 gap-4 mb-12">
            {[
              { to: "/agents/new", icon: Bot, title: "エージェント作成", primary: true, variant: "primary" as const },
              { to: "/knowledge", icon: BookOpen, title: "ナレッジ登録", variant: "info" as const },
              { to: "/settings", icon: Settings, title: "設定", variant: "muted" as const },
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
                <GlassIcon 
                  icon={item.icon} 
                  size="md" 
                  variant={item.primary ? "default" : item.variant}
                  className={item.primary ? "bg-background/10 border-background/20 text-background" : ""}
                />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        {hasAgents && (
          <>
            {/* Mobile Quick Actions */}
            <MobileQuickActions />

            {/* Mobile Stats Carousel */}
            <MobileStatsCarousel stats={stats} isLoading={isLoading} />

            {/* Desktop Stats */}
            <div className="hidden lg:block mb-12">
              {/* Primary KPIs - large display */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {isLoading ? (
                  <>
                    {/* Desktop stats skeleton */}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="text-center p-6">
                        <Skeleton className="h-10 w-20 mx-auto mb-2" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { label: "エージェント", value: stats.totalAgents },
                      { label: "アクティブ通話", value: stats.publishedAgents },
                      { label: "総会話数", value: stats.todayCount },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-6 rounded-2xl bg-muted/30 border border-border">
                        <div className="text-4xl font-serif font-bold tracking-tight">{stat.value}</div>
                        <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Separator */}
              <div className="border-t border-border/40 mb-6" />

              {/* Secondary stats - smaller cards */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "成功率", value: `${stats.successRate}%`, icon: TrendingUp, variant: "purple" as const },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-muted/20 border border-border/60"
                  >
                    <GlassIcon icon={stat.icon} size="sm" variant={stat.variant} className="mb-2" />
                    <p className="text-xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Create Button */}
            <div className="hidden lg:block mb-12">
              <Button asChild size="lg" className="h-12 px-8 rounded-xl">
                <Link to="/agents/new">
                  <Plus className="h-5 w-5 mr-2" />
                  新しいエージェント
                </Link>
              </Button>
            </div>

            {/* Recent Agents */}
            <div className="mt-6 lg:mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base lg:text-lg font-semibold">エージェント</h2>
                <Link 
                  to="/agents" 
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  すべて
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {isLoadingAgents ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Mobile Agent List */}
                  <div className="lg:hidden space-y-2">
                    {recentAgents.map((agent) => (
                      <MobileAgentCard key={agent.id} agent={agent} />
                    ))}
                  </div>

                  {/* Desktop Agent List */}
                  <div className="hidden lg:grid gap-3">
                    {recentAgents.map((agent) => (
                      <Link
                        key={agent.id}
                        to={`/agents/${agent.id}`}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-all duration-200 group"
                      >
                        {agent.icon_name === 'custom' && agent.custom_icon_url ? (
                          <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-background shadow-sm shrink-0">
                            <img 
                              src={agent.custom_icon_url} 
                              alt={agent.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (() => {
                          const agentColor = agent.icon_color || (agent.status === "published" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))");
                          return (
                            <div
                              className="h-11 w-11 rounded-full flex items-center justify-center border-2 border-background shadow-sm shrink-0 transition-transform group-hover:scale-105"
                              style={{ backgroundColor: `${agent.icon_color || 'hsl(var(--muted))'}20`, borderColor: agentColor }}
                            >
                              <DynamicIcon name={agent.icon_name} className="h-5 w-5" style={{ color: agentColor }} />
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium text-base truncate">{agent.name}</p>
                            <Badge 
                              variant={agent.status === "published" ? "default" : "secondary"}
                              className="text-xs shrink-0"
                            >
                              {agent.status === "published" ? "公開中" : "下書き"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {agent.description || "説明なし"}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
