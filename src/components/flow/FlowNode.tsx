import { cn } from "@/lib/utils";
import {
  MessageSquare,
  HelpCircle,
  GitBranch,
  Webhook,
  StopCircle,
  GripVertical,
} from "lucide-react";

export type NodeType = "speak" | "ask" | "condition" | "webhook" | "end";

interface FlowNodeProps {
  type: NodeType;
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
}

const nodeConfig: Record<
  NodeType,
  { icon: typeof MessageSquare; color: string; bgColor: string }
> = {
  speak: {
    icon: MessageSquare,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  ask: {
    icon: HelpCircle,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  condition: {
    icon: GitBranch,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  webhook: {
    icon: Webhook,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  end: {
    icon: StopCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
};

export function FlowNode({
  type,
  title,
  description,
  selected,
  onClick,
}: FlowNodeProps) {
  const config = nodeConfig[type];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flow-node group relative w-64",
        selected && "flow-node-selected"
      )}
    >
      {/* Drag Handle */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Connectors */}
      <div className="flow-connector -top-1.5 left-1/2 -translate-x-1/2" />
      <div className="flow-connector -bottom-1.5 left-1/2 -translate-x-1/2" />

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            config.bgColor,
            config.color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
