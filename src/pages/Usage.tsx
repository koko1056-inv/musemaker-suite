import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Phone,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface UsageStats {
  totalCalls: number;
  totalMinutes: number;
  completedCalls: number;
  failedCalls: number;
  averageDuration: number;
}

interface DailyUsage {
  date: string;
  calls: number;
  minutes: number;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const Usage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats>({
    totalCalls: 0,
    totalMinutes: 0,
    completedCalls: 0,
    failedCalls: 0,
    averageDuration: 0,
  });
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);

  useEffect(() => {
    const fetchUsageData = async () => {
      setIsLoading(true);
      try {
        // 期間に基づいて日付範囲を計算
        const now = new Date();
        let startDate = new Date();
        if (period === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (period === "month") {
          startDate.setMonth(now.getMonth() - 1);
        } else if (period === "year") {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // 会話データを取得
        const { data: conversations, error } = await supabase
          .from("conversations")
          .select("*")
          .gte("started_at", startDate.toISOString());

        if (error) {
          console.error("Error fetching conversations:", error);
          return;
        }

        if (conversations) {
          const totalCalls = conversations.length;
          const completedCalls = conversations.filter(c => c.status === "completed").length;
          const failedCalls = conversations.filter(c => c.status === "failed").length;
          const totalSeconds = conversations.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
          const totalMinutes = Math.round(totalSeconds / 60);
          const averageDuration = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;

          setStats({
            totalCalls,
            totalMinutes,
            completedCalls,
            failedCalls,
            averageDuration,
          });

          // 日別データを集計
          const dailyMap = new Map<string, { calls: number; minutes: number }>();
          conversations.forEach(conv => {
            const date = new Date(conv.started_at).toISOString().split("T")[0];
            const existing = dailyMap.get(date) || { calls: 0, minutes: 0 };
            dailyMap.set(date, {
              calls: existing.calls + 1,
              minutes: existing.minutes + Math.round((conv.duration_seconds || 0) / 60),
            });
          });

          const sortedDaily = Array.from(dailyMap.entries())
            .map(([date, data]) => ({
              date: new Date(date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
              ...data,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

          setDailyUsage(sortedDaily);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageData();
  }, [period]);

  const statusData = [
    { name: "完了", value: stats.completedCalls },
    { name: "進行中", value: stats.totalCalls - stats.completedCalls - stats.failedCalls },
    { name: "失敗", value: stats.failedCalls },
  ];

  // プラン使用量（デモ用の固定値）
  const planLimits = {
    calls: 1000,
    minutes: 5000,
  };

  const usagePercentage = {
    calls: Math.min((stats.totalCalls / planLimits.calls) * 100, 100),
    minutes: Math.min((stats.totalMinutes / planLimits.minutes) * 100, 100),
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">利用量ダッシュボード</h1>
            <p className="text-muted-foreground mt-1">
              通話時間とAPI使用量をモニタリング
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">過去7日間</SelectItem>
              <SelectItem value="month">過去30日間</SelectItem>
              <SelectItem value="year">過去1年間</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* プラン使用量 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              プラン使用量
            </CardTitle>
            <CardDescription>
              今月の使用状況と残り利用可能量
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">通話数</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalCalls.toLocaleString()} / {planLimits.calls.toLocaleString()} 件
                  </span>
                </div>
                <Progress value={usagePercentage.calls} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">通話時間</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalMinutes.toLocaleString()} / {planLimits.minutes.toLocaleString()} 分
                  </span>
                </div>
                <Progress value={usagePercentage.minutes} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総通話数</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                完了: {stats.completedCalls} / 失敗: {stats.failedCalls}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総通話時間</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMinutes.toLocaleString()}分</div>
              <p className="text-xs text-muted-foreground">
                約 {Math.round(stats.totalMinutes / 60)} 時間
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均通話時間</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageDuration / 60)}分</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageDuration} 秒
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCalls > 0 
                  ? Math.round((stats.completedCalls / stats.totalCalls) * 100) 
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                完了した通話の割合
              </p>
            </CardContent>
          </Card>
        </div>

        {/* グラフ */}
        <Tabs defaultValue="calls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calls">通話数推移</TabsTrigger>
            <TabsTrigger value="minutes">通話時間推移</TabsTrigger>
            <TabsTrigger value="status">ステータス分布</TabsTrigger>
          </TabsList>

          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>日別通話数</CardTitle>
                <CardDescription>期間内の日別通話数の推移</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {dailyUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyUsage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="calls" fill="hsl(var(--primary))" name="通話数" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      データがありません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="minutes">
            <Card>
              <CardHeader>
                <CardTitle>日別通話時間</CardTitle>
                <CardDescription>期間内の日別通話時間（分）の推移</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {dailyUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyUsage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="minutes"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.2)"
                          name="通話時間（分）"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      データがありません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>通話ステータス分布</CardTitle>
                <CardDescription>完了・進行中・失敗の割合</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {stats.totalCalls > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted-foreground">データがありません</div>
                  )}
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index] }} 
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Usage;
