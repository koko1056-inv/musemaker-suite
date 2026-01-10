import { Bot, Zap, Phone, Folder } from "lucide-react";

interface AgentOverviewStatsProps {
  totalAgents: number;
  activeAgents: number;
  agentsWithPhone: number;
  totalFolders: number;
}

// Pixel art stat card
const PixelStatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color,
  highlight 
}: { 
  icon: any; 
  value: number; 
  label: string; 
  color: string;
  highlight?: boolean;
}) => (
  <div className={`relative p-4 rounded-xl border transition-all ${highlight ? 'bg-card border-primary/30' : 'bg-card/50 border-border/50'}`}>
    <div className="flex items-center gap-3">
      {/* Pixel style icon container */}
      <div 
        className="w-10 h-10 flex items-center justify-center rounded-lg"
        style={{ 
          backgroundColor: `${color}15`,
          imageRendering: 'pixelated' as const,
        }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
    
    {/* Pixel corner decoration */}
    <div 
      className="absolute top-0 right-0 w-2 h-2"
      style={{ backgroundColor: color, opacity: highlight ? 1 : 0.3 }}
    />
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
      <PixelStatCard 
        icon={Bot} 
        value={totalAgents} 
        label="総エージェント数" 
        color="#6366f1"
      />
      <PixelStatCard 
        icon={Zap} 
        value={activeAgents} 
        label="稼働中" 
        color="#22c55e"
        highlight={activeAgents > 0}
      />
      <PixelStatCard 
        icon={Phone} 
        value={agentsWithPhone} 
        label="電話番号割当" 
        color="#f97316"
        highlight={agentsWithPhone > 0}
      />
      <PixelStatCard 
        icon={Folder} 
        value={totalFolders} 
        label="フォルダ数" 
        color="#8b5cf6"
      />
    </div>
  );
}
