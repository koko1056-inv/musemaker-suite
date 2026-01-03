import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
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
import {
  Phone,
  Clock,
  CheckCircle,
  TrendingUp,
  Target,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const conversationData = [
  { date: "1月14日", conversations: 145 },
  { date: "1月15日", conversations: 232 },
  { date: "1月16日", conversations: 189 },
  { date: "1月17日", conversations: 278 },
  { date: "1月18日", conversations: 315 },
  { date: "1月19日", conversations: 198 },
  { date: "1月20日", conversations: 256 },
];

const agentPerformance = [
  { name: "カスタマーサポート", success: 94, calls: 450 },
  { name: "営業アシスタント", success: 87, calls: 280 },
  { name: "予約エージェント", success: 91, calls: 320 },
  { name: "FAQヘルパー", success: 96, calls: 190 },
];

const outcomeData = [
  { name: "解決済み", value: 65, color: "hsl(142, 70%, 45%)" },
  { name: "転送済み", value: 20, color: "hsl(221, 83%, 53%)" },
  { name: "予約済み", value: 10, color: "hsl(250, 83%, 65%)" },
  { name: "失敗", value: 5, color: "hsl(0, 63%, 31%)" },
];

export default function Analytics() {
  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">分析</h1>
            <p className="mt-1 text-muted-foreground">
              すべてのエージェントのパフォーマンスとインサイトを追跡
            </p>
          </div>
          <Select defaultValue="7d">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">過去24時間</SelectItem>
              <SelectItem value="7d">過去7日間</SelectItem>
              <SelectItem value="30d">過去30日間</SelectItem>
              <SelectItem value="90d">過去90日間</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="総通話数"
            value="1,613"
            change="+18.2%"
            changeType="positive"
            icon={<Phone className="h-6 w-6" />}
          />
          <StatCard
            title="平均通話時間"
            value="3分12秒"
            change="-5%"
            changeType="positive"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="成功率"
            value="92.4%"
            change="+2.1%"
            changeType="positive"
            icon={<CheckCircle className="h-6 w-6" />}
          />
          <StatCard
            title="解決率"
            value="87.8%"
            change="+4.3%"
            changeType="positive"
            icon={<Target className="h-6 w-6" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Conversations Over Time */}
          <div className="glass rounded-xl card-shadow animate-fade-in">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="font-semibold text-foreground">会話数の推移</h3>
              <p className="text-sm text-muted-foreground">日別会話数</p>
            </div>
            <div className="p-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversationData}>
                    <defs>
                      <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222, 47%, 8%)",
                        border: "1px solid hsl(217, 33%, 17%)",
                        borderRadius: "8px",
                        color: "hsl(210, 40%, 98%)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorConv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Outcome Distribution */}
          <div className="glass rounded-xl card-shadow animate-fade-in">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="font-semibold text-foreground">結果の分布</h3>
              <p className="text-sm text-muted-foreground">会話の終了方法</p>
            </div>
            <div className="p-6">
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222, 47%, 8%)",
                        border: "1px solid hsl(217, 33%, 17%)",
                        borderRadius: "8px",
                        color: "hsl(210, 40%, 98%)",
                      }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {outcomeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="glass rounded-xl card-shadow animate-fade-in lg:col-span-2">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="font-semibold text-foreground">エージェントパフォーマンス</h3>
              <p className="text-sm text-muted-foreground">エージェント別成功率</p>
            </div>
            <div className="p-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222, 47%, 8%)",
                        border: "1px solid hsl(217, 33%, 17%)",
                        borderRadius: "8px",
                        color: "hsl(210, 40%, 98%)",
                      }}
                      formatter={(value: number) => [`${value}%`, "成功率"]}
                    />
                    <Bar dataKey="success" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
