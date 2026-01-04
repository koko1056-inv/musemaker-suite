import { useState, useRef, useCallback } from "react";
import { FlowNode, NodeType } from "./FlowNode";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  HelpCircle,
  GitBranch,
  Webhook,
  StopCircle,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Undo,
  Redo,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FlowNodeData {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
}

const nodeOptions = [
  { type: "speak" as const, icon: MessageSquare, label: "発話", color: "from-blue-500 to-blue-600" },
  { type: "ask" as const, icon: HelpCircle, label: "質問", color: "from-purple-500 to-purple-600" },
  { type: "condition" as const, icon: GitBranch, label: "条件分岐", color: "from-amber-500 to-orange-500" },
  { type: "webhook" as const, icon: Webhook, label: "Webhook", color: "from-emerald-500 to-green-600" },
  { type: "end" as const, icon: StopCircle, label: "終了", color: "from-rose-500 to-red-600" },
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
  const [zoom, setZoom] = useState(1);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setShowNodePicker(false);
  };

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
      onNodeSelect?.(null);
    }
  }, [selectedNode, onNodeSelect]);

  const duplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode: FlowNodeData = {
        ...node,
        id: `node-${Date.now()}`,
        title: `${node.title} (コピー)`,
      };
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      const newNodes = [...nodes];
      newNodes.splice(nodeIndex + 1, 0, newNode);
      setNodes(newNodes);
    }
  }, [nodes]);

  const handleDragStart = (nodeId: string) => {
    setDraggedNode(nodeId);
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  const handleDragOver = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    if (draggedNode && draggedNode !== targetNodeId) {
      const draggedIndex = nodes.findIndex(n => n.id === draggedNode);
      const targetIndex = nodes.findIndex(n => n.id === targetNodeId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newNodes = [...nodes];
        const [draggedNodeData] = newNodes.splice(draggedIndex, 1);
        newNodes.splice(targetIndex, 0, draggedNodeData);
        setNodes(newNodes);
      }
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-br from-muted/30 via-background to-muted/20">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        }}
      />

      {/* Top Toolbar */}
      <div className="absolute left-4 top-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Node Picker */}
          <div className="relative">
            <Button 
              onClick={() => setShowNodePicker(!showNodePicker)}
              className={cn(
                "gap-2 shadow-lg transition-all duration-200",
                "bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:scale-105"
              )}
            >
              <Plus className="h-4 w-4" />
              ノードを追加
            </Button>
            
            {/* Node Picker Dropdown */}
            {showNodePicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-card/95 backdrop-blur-xl border-2 border-border rounded-2xl shadow-2xl w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  ノードタイプを選択
                </p>
                <div className="space-y-1">
                  {nodeOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => addNode(option.type)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80 transition-all duration-200 group"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                        `bg-gradient-to-br ${option.color}`
                      )}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.type === "speak" && "メッセージを伝える"}
                          {option.type === "ask" && "ユーザーに質問する"}
                          {option.type === "condition" && "ロジックで分岐"}
                          {option.type === "webhook" && "外部APIを呼び出す"}
                          {option.type === "end" && "会話を終了"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Undo/Redo */}
          <TooltipProvider>
            <div className="flex items-center bg-card/80 backdrop-blur-sm border border-border rounded-xl p-1 shadow-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>元に戻す</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>やり直す</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <TooltipProvider>
            <div className="flex items-center bg-card/80 backdrop-blur-sm border border-border rounded-xl p-1 shadow-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={zoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>縮小</TooltipContent>
              </Tooltip>
              <span className="px-2 text-xs font-medium text-muted-foreground min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={zoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>拡大</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={resetZoom}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>フィット</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Action Buttons */}
          <Button variant="outline" size="sm" className="gap-2 shadow-lg bg-card/80 backdrop-blur-sm">
            <Download className="h-4 w-4" />
            エクスポート
          </Button>
          <Button size="sm" className="gap-2 shadow-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0">
            <Play className="h-4 w-4" />
            テスト実行
          </Button>
        </div>
      </div>

      {/* Canvas Content */}
      <div 
        ref={containerRef}
        className="h-full overflow-auto pt-20 pb-8"
        onClick={(e) => {
          if (e.target === containerRef.current) {
            setShowNodePicker(false);
          }
        }}
      >
        <div 
          className="flex flex-col items-center gap-2 py-8 min-h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {/* Start Indicator */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-xl">
              <Play className="h-5 w-5 ml-0.5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-wider">開始</span>
          </div>

          {/* Connection Line */}
          <div className="relative h-8">
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-primary to-border" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2 h-2 rotate-45 border-r-2 border-b-2 border-primary -mb-1" />
          </div>

          {/* Nodes */}
          {nodes.map((node, index) => (
            <div 
              key={node.id} 
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
              draggable
              onDragStart={() => handleDragStart(node.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, node.id)}
            >
              <FlowNode
                type={node.type}
                title={node.title}
                description={node.description}
                selected={selectedNode === node.id}
                onClick={() => handleNodeClick(node)}
                onDelete={() => deleteNode(node.id)}
                onDuplicate={() => duplicateNode(node.id)}
                isDragging={draggedNode === node.id}
                nodeNumber={index + 1}
              />
              
              {/* Connection Line between nodes */}
              {index < nodes.length - 1 && (
                <div className="relative h-10 flex items-center justify-center">
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-border via-muted-foreground/30 to-border" />
                  {/* Animated dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2 h-2 rotate-45 border-r-2 border-b-2 border-muted-foreground/50 -mb-1" />
                </div>
              )}
            </div>
          ))}

          {/* Add Node Button at End */}
          <div className="mt-6">
            <button
              onClick={() => setShowNodePicker(true)}
              className="group flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 hover:bg-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                ノードを追加
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              {nodes.length} ノード
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-muted-foreground">
            ドラッグで並び替え • クリックで編集
          </span>
        </div>
      </div>
    </div>
  );
}
