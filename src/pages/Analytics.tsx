import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgents } from "@/hooks/useAgents";
import { useConversations } from "@/hooks/useConversations";
import { Bot, MessageSquare, Phone, Clock, Loader2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const { agents, isLoading: isLoadingAgents } = useAgents();
  const { conversations, isLoading: isLoadingConversations } = useConversations();

  const isLoading = isLoadingAgents || isLoadingConversations;

  // Calculate stats from real data
  const totalAgents = agents?.length || 0;
  const publishedAgents = agents?.filter(a => a.status === "published").length || 0;
  const totalConversations = conversations?.length || 0;
  const completedConversations = conversations?.filter(c => c.status === "completed").length || 0;

  // Calculate average call duration
  const conversationsWithDuration = conversations?.filter(c => c.duration_seconds) || [];
  const avgDuration = conversationsWithDuration.length > 0
    ? Math.round(conversationsWithDuration.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / conversationsWithDuration.length)
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // Group conversations by agent
  const conversationsByAgent = agents?.map(agent => ({
    agent,
    count: conversations?.filter(c => c.agent_id === agent.id).length || 0,
  })).sort((a, b) => b.count - a.count) || [];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">分析</h1>
          <p className="mt-1 text-muted-foreground">
            エージェントのパフォーマンスを確認
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    エージェント数
                  </CardTitle>
                  <Bot className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalAgents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    公開中: {publishedAgents}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    総通話数
                  </CardTitle>
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalConversations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    完了: {completedConversations}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    平均通話時間
                  </CardTitle>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {avgDuration > 0 ? formatDuration(avgDuration) : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversationsWithDuration.length}件のデータ
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    完了率
                  </CardTitle>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {totalConversations > 0
                      ? `${Math.round((completedConversations / totalConversations) * 100)}%`
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    通話完了率
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Agent Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  エージェント別通話数
                </CardTitle>
                <CardDescription>
                  各エージェントの利用状況
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversationsByAgent.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      データがまだありません
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationsByAgent.map(({ agent, count }) => (
                      <div key={agent.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium truncate">{agent.name}</p>
                            <Badge variant={agent.status === "published" ? "default" : "secondary"}>
                              {count}件
                            </Badge>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${totalConversations > 0 ? (count / totalConversations) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
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
