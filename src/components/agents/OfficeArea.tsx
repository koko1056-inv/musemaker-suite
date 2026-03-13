import { Folder, Phone } from "lucide-react";
import { Agent, AgentFolder, PhoneNumber } from "./OfficeFloorTypes";
import { Desk } from "./Desk";

// オフィスエリア（フォルダ対応）
export const OfficeArea = ({
  folder,
  agents,
  maxDesks = 6,
  onAgentClick,
  onAddAgent,
  phoneNumbers,
  onCallAgentIds
}: {
  folder?: AgentFolder;
  agents: Agent[];
  maxDesks?: number;
  onAgentClick: (agent: Agent) => void;
  onAddAgent: (folderId: string | null) => void;
  phoneNumbers: PhoneNumber[];
  onCallAgentIds: Set<string>;
}) => {
  const areaColor = folder?.color || '#64748b';
  const areaName = folder?.name || '未分類エリア';

  // デスクの数（最低でもmaxDesksまで表示）
  const desks = [...agents];
  while (desks.length < maxDesks) {
    desks.push(null as any);
  }

  // 通話中エージェント数
  const onCallCount = agents.filter(a => onCallAgentIds.has(a.id)).length;

  return <div className="relative p-4 rounded-xl border-2 transition-all hover:shadow-lg" style={{
    borderColor: areaColor,
    background: `linear-gradient(135deg, ${areaColor}10, ${areaColor}05)`
  }}>
      {/* エリア名ラベル */}
      <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{
      backgroundColor: areaColor
    }}>
        <div className="flex items-center gap-1.5">
          <Folder className="w-3 h-3" />
          {areaName}
        </div>
      </div>

      {/* 統計 - 通話中数を追加 */}
      <div className="absolute -top-3 right-4 flex items-center gap-2">
        {onCallCount > 0 && (
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm flex items-center gap-1 animate-pulse">
            <Phone className="w-3 h-3" />
            {onCallCount}
          </div>
        )}
        <div className="px-2 py-1 rounded-full text-xs font-medium bg-background border shadow-sm">
          <span className="text-foreground">{agents.length}</span>
          <span className="text-muted-foreground">/{maxDesks}</span>
        </div>
      </div>

      {/* デスク配置グリッド - モバイルでは2列 */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-2 sm:gap-x-4 gap-y-8 justify-items-center">
        {desks.slice(0, maxDesks).map((agent, idx) => {
        const hasAgent = agent !== null;
        const isActive = hasAgent && agent.status === 'published' && !!agent.elevenlabs_agent_id;
        const isOnCall = hasAgent && onCallAgentIds.has(agent.id);
        const hasPhone = hasAgent && phoneNumbers.some(p => p.agent_id === agent?.id);
        return <Desk key={hasAgent ? agent.id : `empty-${idx}`} hasAgent={hasAgent} agent={agent} isActive={isActive} isOnCall={isOnCall} onClick={hasAgent ? () => onAgentClick(agent) : undefined} onAddAgent={() => onAddAgent(folder?.id || null)} folderId={folder?.id} />;
      })}
      </div>
    </div>;
};
