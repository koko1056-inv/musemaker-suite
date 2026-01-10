import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Bot } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "published";
  icon_name: string | null;
  icon_color: string | null;
  custom_icon_url: string | null;
}

interface MobileAgentCardProps {
  agent: Agent;
}

export function MobileAgentCard({ agent }: MobileAgentCardProps) {
  const iconName = agent.icon_name || 'Bot';
  const IconComponent = (LucideIcons as unknown as Record<string, typeof Bot>)[iconName] || Bot;
  const agentColor = agent.icon_color || (agent.status === "published" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))");

  return (
    <Link
      to={`/agents/${agent.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card active:bg-muted/50 transition-colors touch-target"
    >
      {agent.icon_name === 'custom' && agent.custom_icon_url ? (
        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border shrink-0">
          <img 
            src={agent.custom_icon_url} 
            alt={agent.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div 
          className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${agent.icon_color || 'hsl(var(--muted))'}20`, borderColor: agentColor }}
        >
          <IconComponent className="h-5 w-5" style={{ color: agentColor }} />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-base truncate">{agent.name}</p>
          <Badge 
            variant={agent.status === "published" ? "default" : "secondary"}
            className="text-[10px] shrink-0"
          >
            {agent.status === "published" ? "公開" : "下書き"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {agent.description || "説明なし"}
        </p>
      </div>
      
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
