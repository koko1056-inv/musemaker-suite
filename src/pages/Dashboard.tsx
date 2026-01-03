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
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back! Here's an overview of your voice agents.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/agents/new">
              <Plus className="h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Agents"
            value="12"
            change="+2"
            changeType="positive"
            icon={<Bot className="h-6 w-6" />}
          />
          <StatCard
            title="Conversations"
            value="8,429"
            change="+12.5%"
            changeType="positive"
            icon={<MessageSquare className="h-6 w-6" />}
          />
          <StatCard
            title="Avg. Duration"
            value="2m 34s"
            change="-8%"
            changeType="negative"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="API Calls"
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
