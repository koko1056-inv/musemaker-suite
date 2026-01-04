import { cn } from "@/lib/utils";
import {
  MessageSquare,
  HelpCircle,
  GitBranch,
  Webhook,
  StopCircle,
  GripVertical,
  Play,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NodeType = "speak" | "ask" | "condition" | "webhook" | "end";

interface FlowNodeProps {
  type: NodeType;
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isDragging?: boolean;
  nodeNumber?: number;
}

const nodeConfig: Record<
  NodeType,
  { icon: typeof MessageSquare; gradient: string; borderColor: string; shadowColor: string }
> = {
  speak: {
    icon: MessageSquare,
    gradient: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500/30",
    shadowColor: "shadow-blue-500/20",
  },
  ask: {
    icon: HelpCircle,
    gradient: "from-purple-500 to-purple-600",
    borderColor: "border-purple-500/30",
    shadowColor: "shadow-purple-500/20",
  },
  condition: {
    icon: GitBranch,
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    shadowColor: "shadow-amber-500/20",
  },
  webhook: {
    icon: Webhook,
    gradient: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/30",
    shadowColor: "shadow-emerald-500/20",
  },
  end: {
    icon: StopCircle,
    gradient: "from-rose-500 to-red-600",
    borderColor: "border-rose-500/30",
    shadowColor: "shadow-rose-500/20",
  },
};

const nodeLabels: Record<NodeType, string> = {
  speak: "発話",
  ask: "質問",
  condition: "条件分岐",
  webhook: "Webhook",
  end: "終了",
};

export function FlowNode({
  type,
  title,
  description,
  selected,
  onClick,
  onDelete,
  onDuplicate,
  isDragging,
  nodeNumber,
}: FlowNodeProps) {
  const config = nodeConfig[type];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-72 cursor-pointer transition-all duration-300",
        "rounded-2xl border-2 bg-card/95 backdrop-blur-sm",
        "hover:scale-[1.02] hover:shadow-xl",
        config.borderColor,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
        isDragging && "opacity-50 scale-105 rotate-2",
        config.shadowColor,
        "shadow-lg"
      )}
    >
      {/* Node Number Badge */}
      {nodeNumber && (
        <div className={cn(
          "absolute -top-3 -left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg z-10",
          `bg-gradient-to-br ${config.gradient}`
        )}>
          {nodeNumber}
        </div>
      )}

      {/* Drag Handle */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing">
        <div className="bg-card border-2 border-border rounded-lg p-1 shadow-md hover:shadow-lg hover:border-primary/50 transition-all">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Top Connector */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 bg-background transition-all duration-200",
          "hover:scale-150 hover:border-primary",
          config.borderColor
        )} />
      </div>

      {/* Bottom Connector */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 bg-background transition-all duration-200",
          "hover:scale-150 hover:border-primary",
          config.borderColor
        )} />
      </div>

      {/* Node Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon Container */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              "bg-gradient-to-br text-white shadow-lg",
              config.gradient
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          
          {/* Text Content */}
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                "bg-gradient-to-r text-white",
                config.gradient
              )}>
                {nodeLabels[type]}
              </span>
            </div>
            <p className="font-semibold text-foreground truncate text-sm">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
                複製
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="text-destructive"
              >
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Actions for selected node */}
        {selected && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 flex-1">
              <Play className="h-3 w-3" />
              テスト
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
