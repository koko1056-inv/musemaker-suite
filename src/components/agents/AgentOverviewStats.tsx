import { Bot, Zap, Phone, Folder, LucideIcon } from "lucide-react";
import { GlassIcon } from "@/components/ui/glass-icon";

interface AgentOverviewStatsProps {
  totalAgents: number;
  activeAgents: number;
  agentsWithPhone: number;
  totalFolders: number;
}

// Glass style stat card
const GlassStatCard = ({ 
  icon, 
  value, 
  label, 
  variant,
  highlight 
}: { 
  icon: LucideIcon; 
  value: number; 
  label: string; 
  variant: "primary" | "success" | "warning" | "purple";
  highlight?: boolean;
}) => (
  <div className={`relative p-4 rounded-xl border transition-all ${highlight ? 'bg-card border-primary/30' : 'bg-card/50 border-border/50'}`}>
    <div className="flex items-center gap-3">
      <GlassIcon icon={icon} size="md" variant={variant} />
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

export function AgentOverviewStats({
  totalAgents,
  activeAgents,
  agentsWithPhone,
  totalFolders,
}: AgentOverviewStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <GlassStatCard 
        icon={Bot} 
        value={totalAgents} 
        label="総エージェント数" 
        variant="primary"
      />
      <GlassStatCard 
        icon={Zap} 
        value={activeAgents} 
        label="稼働中" 
        variant="success"
        highlight={activeAgents > 0}
      />
      <GlassStatCard 
        icon={Phone} 
        value={agentsWithPhone} 
        label="電話番号割当" 
        variant="warning"
        highlight={agentsWithPhone > 0}
      />
      <GlassStatCard 
        icon={Folder} 
        value={totalFolders} 
        label="フォルダ数" 
        variant="purple"
      />
    </div>
  );
}
