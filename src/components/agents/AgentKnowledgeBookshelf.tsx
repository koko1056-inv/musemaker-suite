import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KnowledgeBase, KnowledgeItem } from "@/hooks/useKnowledgeBase";
import type { AgentKnowledgeBase } from "@/hooks/useAgentKnowledgeBases";

interface AgentKnowledgeBookshelfProps {
  linkedKbs: AgentKnowledgeBase[];
  availableKbs: KnowledgeBase[];
  knowledgeItemsByKb: Record<string, KnowledgeItem[]>;
  selectedKbId: string;
  onSelectedKbChange: (value: string) => void;
  onLink: () => void;
  onUnlink: (linkId: string) => void;
  isLinking: boolean;
  isUnlinking: boolean;
}

// 本棚の本コンポーネント（コンパクト版）
function MiniBook({ 
  name, 
  itemCount,
  onRemove 
}: { 
  name: string;
  itemCount: number;
  onRemove: () => void;
}) {
  const colors = [
    { spine: "bg-amber-700", cover: "bg-amber-600" },
    { spine: "bg-emerald-700", cover: "bg-emerald-600" },
    { spine: "bg-blue-700", cover: "bg-blue-600" },
    { spine: "bg-purple-700", cover: "bg-purple-600" },
    { spine: "bg-rose-700", cover: "bg-rose-600" },
    { spine: "bg-orange-700", cover: "bg-orange-600" },
    { spine: "bg-teal-700", cover: "bg-teal-600" },
    { spine: "bg-indigo-700", cover: "bg-indigo-600" },
  ];
  
  const colorIndex = name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  // 厚さをアイテム数に応じて変更
  const thickness = Math.min(32, Math.max(14, itemCount * 3 + 14));

  return (
    <div className="group relative">
      <button
        className="relative cursor-default transition-all duration-300 hover:-translate-y-1"
        style={{ width: `${thickness}px` }}
      >
        {/* 本の背表紙 */}
        <div 
          className={`relative h-24 rounded-sm shadow-lg ${color.spine}`}
          style={{ width: `${thickness}px` }}
        >
          {/* 背表紙のタイトル */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <span 
              className="text-white text-[8px] font-medium whitespace-nowrap"
              style={{ 
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                maxHeight: "88px",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {name.length > 6 ? name.slice(0, 6) + "..." : name}
            </span>
          </div>
          
          {/* 装飾ライン */}
          <div className="absolute top-1.5 left-0 right-0 h-px bg-white/30" />
          <div className="absolute bottom-1.5 left-0 right-0 h-px bg-white/30" />
        </div>
        
        {/* 削除ボタン */}
        <div 
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <div className="h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center cursor-pointer hover:bg-destructive/90 shadow-md">
            <X className="h-3 w-3" />
          </div>
        </div>
      </button>
      
      {/* ツールチップ */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
          {name} ({itemCount}件)
        </div>
      </div>
    </div>
  );
}

export function AgentKnowledgeBookshelf({
  linkedKbs,
  availableKbs,
  knowledgeItemsByKb,
  selectedKbId,
  onSelectedKbChange,
  onLink,
  onUnlink,
  isLinking,
  isUnlinking,
}: AgentKnowledgeBookshelfProps) {
  return (
    <div className="space-y-4">
      {/* ミニ本棚 */}
      <div className="relative">
        <div className="flex items-end gap-1.5 min-h-[100px] px-3 pt-2 pb-3 bg-gradient-to-b from-amber-900/10 to-amber-800/20 rounded-t-lg border-x border-t border-amber-900/20">
          {linkedKbs.length === 0 ? (
            <div className="flex items-center justify-center w-full h-24 text-muted-foreground text-sm">
              <BookOpen className="h-4 w-4 mr-2 opacity-50" />
              本棚は空です
            </div>
          ) : (
            linkedKbs.map((link) => (
              <MiniBook
                key={link.id}
                name={link.knowledge_base?.name || "不明"}
                itemCount={knowledgeItemsByKb[link.knowledge_base_id]?.length || 0}
                onRemove={() => onUnlink(link.id)}
              />
            ))
          )}
        </div>
        
        {/* 本棚の板 */}
        <div className="h-2.5 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-md" />
        
        {/* 影 */}
        <div className="absolute -bottom-1.5 left-2 right-2 h-1.5 bg-black/10 blur-sm rounded-full" />
      </div>

      {/* 本を追加 */}
      {availableKbs.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <Select value={selectedKbId} onValueChange={onSelectedKbChange}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue placeholder="本を追加..." />
            </SelectTrigger>
            <SelectContent>
              {availableKbs.map((kb) => (
                <SelectItem key={kb.id} value={kb.id}>
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    {kb.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onLink}
            disabled={!selectedKbId || isLinking}
            size="sm"
            className="h-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* すべて紐付け済みの場合 */}
      {availableKbs.length === 0 && linkedKbs.length > 0 && (
        <Badge variant="secondary" className="w-full justify-center py-1.5 text-xs">
          すべてのナレッジが紐付け済みです
        </Badge>
      )}
    </div>
  );
}
