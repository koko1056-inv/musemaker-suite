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
  { type: "speak" as const, icon: MessageSquare, label: "Speak", description: "Say something to the user" },
  { type: "ask" as const, icon: HelpCircle, label: "Ask", description: "Ask user a question" },
  { type: "condition" as const, icon: GitBranch, label: "Condition", description: "Branch based on logic" },
  { type: "webhook" as const, icon: Webhook, label: "Webhook", description: "Call external API" },
  { type: "end" as const, icon: StopCircle, label: "End", description: "End conversation" },
];

const initialNodes: FlowNodeData[] = [
  { id: "1", type: "speak", title: "Welcome Message", description: "Greet the user" },
  { id: "2", type: "ask", title: "Get Intent", description: "What can I help you with?" },
  { id: "3", type: "condition", title: "Route by Intent", description: "sales / support / other" },
  { id: "4", type: "webhook", title: "Lookup Customer", description: "Fetch from CRM" },
  { id: "5", type: "speak", title: "Provide Answer", description: "Give response" },
  { id: "6", type: "end", title: "End Call", description: "Say goodbye" },
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
    const newNode: FlowNodeData = {
      id: `node-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      description: "Configure this node",
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
              Add Node
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
