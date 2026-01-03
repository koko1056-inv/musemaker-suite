import { useState } from "react";
import { FlowNode, NodeType } from "./FlowNode";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  HelpCircle,
  GitBranch,
  Webhook,
  StopCircle,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FlowNodeData {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
}

const nodeOptions = [
  { type: "speak" as const, icon: MessageSquare, label: "発話", description: "ユーザーにメッセージを伝える" },
  { type: "ask" as const, icon: HelpCircle, label: "質問", description: "ユーザーに質問する" },
  { type: "condition" as const, icon: GitBranch, label: "条件分岐", description: "ロジックに基づいて分岐" },
  { type: "webhook" as const, icon: Webhook, label: "Webhook", description: "外部APIを呼び出す" },
  { type: "end" as const, icon: StopCircle, label: "終了", description: "会話を終了" },
];

const initialNodes: FlowNodeData[] = [
  { id: "1", type: "speak", title: "ウェルカムメッセージ", description: "ユーザーに挨拶" },
  { id: "2", type: "ask", title: "意図を取得", description: "本日はどのようなご用件でしょうか？" },
  { id: "3", type: "condition", title: "意図による分岐", description: "営業 / サポート / その他" },
  { id: "4", type: "webhook", title: "顧客検索", description: "CRMから取得" },
  { id: "5", type: "speak", title: "回答を提供", description: "返答を伝える" },
  { id: "6", type: "end", title: "通話終了", description: "お別れを言う" },
];

interface FlowCanvasProps {
  onNodeSelect?: (node: FlowNodeData | null) => void;
}

export function FlowCanvas({ onNodeSelect }: FlowCanvasProps) {
  const [nodes, setNodes] = useState<FlowNodeData[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeClick = (node: FlowNodeData) => {
    setSelectedNode(node.id);
    onNodeSelect?.(node);
  };

  const addNode = (type: NodeType) => {
    const typeLabels: Record<NodeType, string> = {
      speak: "発話",
      ask: "質問",
      condition: "条件分岐",
      webhook: "Webhook",
      end: "終了",
    };
    const newNode: FlowNodeData = {
      id: `node-${Date.now()}`,
      type,
      title: `新規${typeLabels[type]}ノード`,
      description: "このノードを設定してください",
    };
    setNodes([...nodes, newNode]);
  };

  return (
    <div className="relative h-full">
      {/* Toolbar */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              ノードを追加
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {nodeOptions.map((option) => (
              <DropdownMenuItem
                key={option.type}
                onClick={() => addNode(option.type)}
                className="flex items-center gap-3"
              >
                <option.icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Canvas */}
      <div className="flow-canvas h-full overflow-auto p-8 pt-16">
        <div className="flex flex-col items-center gap-6 py-8">
          {nodes.map((node, index) => (
            <div key={node.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <FlowNode
                type={node.type}
                title={node.title}
                description={node.description}
                selected={selectedNode === node.id}
                onClick={() => handleNodeClick(node)}
              />
              {index < nodes.length - 1 && (
                <div className="mx-auto h-6 w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
