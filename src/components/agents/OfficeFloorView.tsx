import { useState } from "react";
import { Users, Plus, Phone, Building2 } from "lucide-react";
import { Agent, AgentFolder, PhoneNumber } from "./OfficeFloorTypes";
import { OfficeArea } from "./OfficeArea";
import { AgentDetailDialog } from "./AgentDetailDialog";

interface OfficeFloorViewProps {
  agents: Agent[];
  folders: AgentFolder[];
  phoneNumbers: PhoneNumber[];
  getAgentPhoneNumber: (agentId: string) => PhoneNumber | undefined;
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onMoveToFolder: (agentId: string, folderId: string | null) => void;
}

export function OfficeFloorView({
  agents,
  folders,
  phoneNumbers,
  getAgentPhoneNumber,
  onPhoneAssign,
  onDuplicate,
  onDelete,
  onMoveToFolder
}: OfficeFloorViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // リアルタイムデータは今後Supabaseと連携予定。現在は空のSetを使用。
  const onCallAgentIds = new Set<string>();

  // フォルダごとにエージェントをグループ化
  const agentsByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = agents.filter(a => a.folder_id === folder.id);
    return acc;
  }, {} as Record<string, Agent[]>);
  const agentsWithoutFolder = agents.filter(a => !a.folder_id);
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailOpen(true);
  };
  const handleAddAgent = (folderId: string | null) => {
    // 新規作成ページへ遷移（フォルダ情報付き）
    window.location.href = folderId ? `/agents/new?folder=${folderId}` : '/agents/new';
  };

  // 稼働統計
  const activeCount = agents.filter(a => a.status === 'published' && a.elevenlabs_agent_id).length;
  const onCallCount = onCallAgentIds.size;
  const assignedPhoneCount = agents.filter(a => phoneNumbers.some(p => p.agent_id === a.id)).length;
  return <div className="space-y-6">
      {/* オフィス統計ヘッダー - モバイル対応 */}
      <div className="p-4 rounded-xl bg-muted/30 border">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">コールセンター</h3>
            <p className="text-sm text-muted-foreground hidden sm:block">エージェント配置マップ</p>
          </div>
        </div>
        {/* 統計バッジ - モバイルでは横並びコンパクト表示 */}
        <div className="flex items-center justify-between sm:justify-end gap-0 sm:gap-0 text-xs sm:text-sm mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-background/50 sm:bg-transparent px-3 py-1.5 sm:px-4 sm:py-1 rounded-l-full sm:rounded-full border border-border/50 sm:border-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="font-bold">{agents.length}</span>
            <span className="text-muted-foreground">名</span>
          </div>
          <div className="w-px h-6 bg-border/50 sm:hidden" />
          <div className="flex items-center gap-1.5 sm:gap-2 bg-background/50 sm:bg-transparent px-3 py-1.5 sm:px-4 sm:py-1 border-y border-border/50 sm:border-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-green-600">{activeCount}</span>
            <span className="text-muted-foreground">稼働</span>
          </div>
          <div className="w-px h-6 bg-border/50 sm:hidden" />
          {onCallCount > 0 ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-green-500/20 px-3 py-1.5 sm:px-4 sm:py-1 border-y border-green-400/30 sm:border-0 animate-pulse">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 animate-phone-bounce" />
              <span className="font-bold text-green-500">{onCallCount}</span>
              <span className="text-green-600">通話中</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-background/50 sm:bg-transparent px-3 py-1.5 sm:px-4 sm:py-1 border-y border-border/50 sm:border-0">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/40" />
              <span className="font-bold text-muted-foreground/50">0</span>
              <span className="text-muted-foreground/50">通話中</span>
            </div>
          )}
          <div className="w-px h-6 bg-border/50 sm:hidden" />
          <div className="flex items-center gap-1.5 sm:gap-2 bg-background/50 sm:bg-transparent px-3 py-1.5 sm:px-4 sm:py-1 rounded-r-full sm:rounded-full border border-border/50 sm:border-0">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="font-bold">{assignedPhoneCount}</span>
            <span className="text-muted-foreground">番号</span>
          </div>
        </div>
        {/* リアルタイムデータ未接続の注記 */}
        {onCallCount === 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-right mt-2 sm:mt-1">
            リアルタイムデータは今後追加予定
          </p>
        )}
      </div>

      {/* オフィスフロア */}
      <div className="relative p-6 rounded-2xl border-2 border-border overflow-hidden" style={{
      background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 100%)'
    }}>
        {/* 床パターン */}
        <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px),
              repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)
            `
      }} />

        <div className="relative space-y-6">
          {/* フォルダエリア */}
          {folders.map(folder => <OfficeArea key={folder.id} folder={folder} agents={agentsByFolder[folder.id] || []} maxDesks={6} onAgentClick={handleAgentClick} onAddAgent={handleAddAgent} phoneNumbers={phoneNumbers} onCallAgentIds={onCallAgentIds} />)}

          {/* 未分類エリア */}
          {(agentsWithoutFolder.length > 0 || folders.length === 0) && <OfficeArea agents={agentsWithoutFolder} maxDesks={6} onAgentClick={handleAgentClick} onAddAgent={handleAddAgent} phoneNumbers={phoneNumbers} onCallAgentIds={onCallAgentIds} />}
        </div>
      </div>

      {/* 凡例 - モバイル対応 */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center animate-glow-pulse">
            <Phone className="w-2 h-2 text-white" />
          </div>
          <span>通話中</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
          <span>稼働中</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-muted-foreground/30" />
          <span>準備中</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-dashed border-muted-foreground/50 rounded flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </div>
          <span>空席</span>
        </div>
      </div>

      {/* エージェント詳細ダイアログ */}
      <AgentDetailDialog agent={selectedAgent} isOpen={isDetailOpen} onClose={() => {
      setIsDetailOpen(false);
      setSelectedAgent(null);
    }} phoneNumbers={phoneNumbers} folders={folders} assignedPhone={selectedAgent ? getAgentPhoneNumber(selectedAgent.id) : undefined} onPhoneAssign={onPhoneAssign} onDuplicate={onDuplicate} onDelete={onDelete} onMoveToFolder={onMoveToFolder} />
    </div>;
}
