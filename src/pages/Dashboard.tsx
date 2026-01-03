import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentAgents } from "@/components/dashboard/RecentAgents";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Clock, Zap, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ダッシュボード</h1>
            <p className="mt-1 text-muted-foreground">
              おかえりなさい！音声エージェントの概要をご覧ください。
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
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="総エージェント数"
            value="12"
            change="+2"
            changeType="positive"
            icon={<Bot className="h-6 w-6" />}
          />
          <StatCard
            title="会話数"
            value="8,429"
            change="+12.5%"
            changeType="positive"
            icon={<MessageSquare className="h-6 w-6" />}
          />
          <StatCard
            title="平均通話時間"
            value="2分34秒"
            change="-8%"
            changeType="negative"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="API呼び出し"
            value="24.5K"
            change="+18%"
            changeType="positive"
            icon={<Zap className="h-6 w-6" />}
          />
        </div>

        {/* Charts and Recent */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityChart />
          <RecentAgents />
        </div>
      </div>
    </AppLayout>
  );
}
