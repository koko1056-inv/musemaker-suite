import { useState, useMemo } from "react";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bot, ChevronDown, Variable } from "lucide-react";

interface AgentSelectorProps {
  selectedAgentIds: string[] | null;
  onChange: (agentIds: string[] | null) => void;
  showExtractionFields?: boolean;
  onInsertVariable?: (variable: string) => void;
}

export function AgentSelector({
  selectedAgentIds,
  onChange,
  showExtractionFields = false,
  onInsertVariable,
}: AgentSelectorProps) {
  const { agents } = useAgents();
  const [open, setOpen] = useState(false);

  const isAllSelected = selectedAgentIds === null;
  const selectedSet = new Set(selectedAgentIds || []);

  // 選択されたエージェントの抽出フィールドを取得
  const agentIdsToFetch = isAllSelected
    ? agents?.map((a) => a.id) || []
    : selectedAgentIds || [];

  const { data: extractionFields = [] } = useQuery({
    queryKey: ["extraction-fields-for-agents", agentIdsToFetch],
    queryFn: async () => {
      if (agentIdsToFetch.length === 0) return [];

      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agentIdsToFetch);

      if (error) throw error;
      return data;
    },
    enabled: showExtractionFields && agentIdsToFetch.length > 0,
  });

  // ユニークなフィールドを取得（field_keyでグループ化）
  const uniqueFields = useMemo(() => {
    const map = new Map<string, { field_key: string; field_name: string; agentNames: string[] }>();
    extractionFields.forEach((field) => {
      const agent = agents?.find((a) => a.id === field.agent_id);
      const agentName = agent?.name || "不明";
      
      if (map.has(field.field_key)) {
        map.get(field.field_key)!.agentNames.push(agentName);
      } else {
        map.set(field.field_key, {
          field_key: field.field_key,
          field_name: field.field_name,
          agentNames: [agentName],
        });
      }
    });
    return Array.from(map.values());
  }, [extractionFields, agents]);

  const handleToggleAgent = (agentId: string) => {
    if (isAllSelected) {
      // 「すべて」から特定のエージェントを選択に切り替え
      onChange([agentId]);
    } else {
      if (selectedSet.has(agentId)) {
        const newSelected = [...selectedSet].filter((id) => id !== agentId);
        onChange(newSelected.length === 0 ? null : newSelected);
      } else {
        onChange([...selectedSet, agentId]);
      }
    }
  };

  const handleSelectAll = () => {
    onChange(null);
  };

  const selectedAgentNames = useMemo(() => {
    if (isAllSelected) return "すべてのエージェント";
    if (!agents || selectedAgentIds?.length === 0) return "エージェントを選択";
    const names = selectedAgentIds
      ?.map((id) => agents.find((a) => a.id === id)?.name)
      .filter(Boolean);
    if (names && names.length <= 2) return names.join(", ");
    return `${names?.slice(0, 2).join(", ")} 他${(names?.length || 0) - 2}件`;
  }, [isAllSelected, agents, selectedAgentIds]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          対象エージェント
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-11"
            >
              <span className="truncate">{selectedAgentNames}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <div className="p-2 border-b">
              <div
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                onClick={handleSelectAll}
              >
                <Checkbox
                  id="all-agents"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="all-agents"
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  すべてのエージェント
                </label>
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto p-2">
              {agents?.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleToggleAgent(agent.id)}
                >
                  <Checkbox
                    id={`agent-${agent.id}`}
                    checked={isAllSelected || selectedSet.has(agent.id)}
                    onCheckedChange={() => handleToggleAgent(agent.id)}
                  />
                  <label
                    htmlFor={`agent-${agent.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {agent.name}
                  </label>
                </div>
              ))}
              {(!agents || agents.length === 0) && (
                <p className="text-sm text-muted-foreground p-2">
                  エージェントがありません
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          通知対象のエージェントを選択してください。未選択の場合はすべてのエージェントが対象になります。
        </p>
      </div>

      {showExtractionFields && onInsertVariable && uniqueFields.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Variable className="h-3 w-3" />
            選択中のエージェントで利用可能な抽出変数:
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueFields.map((field) => (
              <Badge
                key={field.field_key}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/20 text-xs"
                onClick={() => onInsertVariable(`{{extracted.${field.field_key}}}`)}
                title={`使用エージェント: ${field.agentNames.join(", ")}`}
              >
                {field.field_name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
