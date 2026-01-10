import { Bot, MessageSquare, Phone, TrendingUp, Loader2 } from "lucide-react";
import { GlassIcon } from "@/components/ui/glass-icon";

interface MobileStatsCarouselProps {
  stats: {
    totalAgents: number;
    publishedAgents: number;
    todayCount: number;
    successRate: number;
  };
  isLoading: boolean;
}

const statItems = [
  { key: "totalAgents", label: "エージェント", icon: Bot, variant: "primary" as const, suffix: "" },
  { key: "publishedAgents", label: "公開中", icon: Phone, variant: "success" as const, suffix: "" },
  { key: "todayCount", label: "今日の通話", icon: MessageSquare, variant: "info" as const, suffix: "" },
  { key: "successRate", label: "成功率", icon: TrendingUp, variant: "purple" as const, suffix: "%" },
];

export function MobileStatsCarousel({ stats, isLoading }: MobileStatsCarouselProps) {
  return (
    <div className="lg:hidden -mx-4 px-4">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {statItems.map((stat) => {
          const value = stats[stat.key as keyof typeof stats];
          return (
            <div
              key={stat.key}
              className="flex-shrink-0 w-[140px] snap-start"
            >
              <div className="p-4 rounded-2xl bg-card border border-border h-full">
                <GlassIcon icon={stat.icon} size="sm" variant={stat.variant} className="mb-3" />
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p className="text-2xl font-semibold tracking-tight">
                      {value}{stat.suffix}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
