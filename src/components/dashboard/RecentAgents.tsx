import { Link } from "react-router-dom";
import { Bot, ArrowRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

const agents = [
  {
    id: "1",
    name: "Customer Support",
    status: "published",
    conversations: 1234,
    lastActive: "2 min ago",
  },
  {
    id: "2",
    name: "Sales Assistant",
    status: "draft",
    conversations: 0,
    lastActive: "1 hour ago",
  },
  {
    id: "3",
    name: "Booking Agent",
    status: "published",
    conversations: 567,
    lastActive: "5 min ago",
  },
  {
    id: "4",
    name: "FAQ Helper",
    status: "published",
    conversations: 890,
    lastActive: "12 min ago",
  },
];

export function RecentAgents() {
  return (
    <div className="glass rounded-xl card-shadow animate-fade-in">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <h3 className="font-semibold text-foreground">Recent Agents</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/agents" className="flex items-center gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="divide-y divide-border/50">
        {agents.map((agent, index) => (
          <Link
            key={agent.id}
            to={`/agents/${agent.id}`}
            className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{agent.name}</p>
              <p className="text-sm text-muted-foreground">{agent.lastActive}</p>
            </div>
            <div className="flex items-center gap-2">
              <Circle
                className={`h-2 w-2 ${
                  agent.status === "published"
                    ? "fill-success text-success"
                    : "fill-muted-foreground text-muted-foreground"
                }`}
              />
              <span className="text-sm capitalize text-muted-foreground">
                {agent.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {agent.conversations.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">conversations</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
