import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Loader2, RefreshCw, Check, Zap, CloudUpload } from "lucide-react";
import { useKnowledgeBases, useAllKnowledgeItems } from "@/hooks/useKnowledgeBase";
import {
  useAgentKnowledgeBases,
  useLinkKnowledgeBase,
  useUnlinkKnowledgeBase,
} from "@/hooks/useAgentKnowledgeBases";
import { useAgents } from "@/hooks/useAgents";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AgentKnowledgeBookshelf } from "./AgentKnowledgeBookshelf";

interface AgentKnowledgeSectionProps {
  agentId: string | undefined;
  isNew: boolean;
}

export function AgentKnowledgeSection({ agentId, isNew }: AgentKnowledgeSectionProps) {
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingAPI, setIsSyncingAPI] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [lastSyncedAPI, setLastSyncedAPI] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const prevLinkedKbsRef = useRef<string[]>([]);

  const { data: allKnowledgeBases = [], isLoading: isLoadingKbs } = useKnowledgeBases();
  const { data: linkedKbs = [], isLoading: isLoadingLinked } = useAgentKnowledgeBases(agentId);
  const { data: allKnowledgeItems = {} } = useAllKnowledgeItems();
  const linkKb = useLinkKnowledgeBase();
  const unlinkKb = useUnlinkKnowledgeBase();
  const { syncKnowledgeBase, syncKnowledgeBaseAPI } = useAgents();

  const linkedKbIds = linkedKbs.map((link) => link.knowledge_base_id);
  const availableKbs = allKnowledgeBases.filter((kb) => !linkedKbIds.includes(kb.id));
  
  // useAllKnowledgeItemsは既にグループ化されたデータを返す
  const knowledgeItemsByKb = allKnowledgeItems;

  // Auto-sync when knowledge bases are linked/unlinked
  useEffect(() => {
    if (!agentId || !autoSyncEnabled || isLoadingLinked) return;
    
    const currentIds = linkedKbs.map(kb => kb.knowledge_base_id).sort().join(',');
    const prevIds = prevLinkedKbsRef.current.sort().join(',');
    
    // Only sync if the linked knowledge bases have changed (and we have previous data)
    if (prevLinkedKbsRef.current.length > 0 && currentIds !== prevIds) {
      handleAutoSync();
    }
    
    prevLinkedKbsRef.current = linkedKbs.map(kb => kb.knowledge_base_id);
  }, [linkedKbs, agentId, autoSyncEnabled, isLoadingLinked]);

  const handleAutoSync = async () => {
    if (!agentId || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncKnowledgeBase(agentId);
      setLastSynced(new Date());
      toast.success("ナレッジを自動同期しました");
    } catch (error) {
      console.error("Auto-sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLink = async () => {
    if (!agentId || !selectedKbId) return;
    await linkKb.mutateAsync({ agent_id: agentId, knowledge_base_id: selectedKbId });
    setSelectedKbId("");
  };

  const handleUnlink = async (linkId: string) => {
    if (!agentId) return;
    await unlinkKb.mutateAsync({ id: linkId, agent_id: agentId });
  };

  const handleSyncKnowledge = async () => {
    if (!agentId) return;
    setIsSyncing(true);
    try {
      await syncKnowledgeBase(agentId);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to sync knowledge:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync using ElevenLabs Knowledge Base API
  const handleSyncKnowledgeAPI = async () => {
    if (!agentId) return;
    setIsSyncingAPI(true);
    try {
      await syncKnowledgeBaseAPI(agentId);
      setLastSyncedAPI(new Date());
    } catch (error) {
      console.error("Failed to sync knowledge API:", error);
    } finally {
      setIsSyncingAPI(false);
    }
  };

  if (isNew) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            ナレッジベース
          </CardTitle>
          <CardDescription>
            エージェント作成後にナレッジベースを紐付けできます
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isLoading = isLoadingKbs || isLoadingLinked;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              ナレッジベース
            </CardTitle>
            <CardDescription>
              エージェントが参照するナレッジを選択します
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/knowledge">管理</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 本棚ビュー */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <AgentKnowledgeBookshelf
              linkedKbs={linkedKbs}
              availableKbs={availableKbs}
              knowledgeItemsByKb={knowledgeItemsByKb}
              selectedKbId={selectedKbId}
              onSelectedKbChange={setSelectedKbId}
              onLink={handleLink}
              onUnlink={handleUnlink}
              isLinking={linkKb.isPending}
              isUnlinking={unlinkKb.isPending}
            />

            {/* ナレッジベースがない場合 */}
            {allKnowledgeBases.length === 0 && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-2">
                  ナレッジベースがありません
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/knowledge">
                    <Plus className="h-4 w-4 mr-2" />
                    ナレッジベースを作成
                  </Link>
                </Button>
              </div>
            )}

            {/* Sync Buttons - 本がある場合のみ表示 */}
            {linkedKbs.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2"
                        onClick={handleSyncKnowledgeAPI}
                        disabled={isSyncingAPI}
                      >
                        {isSyncingAPI ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : lastSyncedAPI ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <CloudUpload className="h-4 w-4" />
                        )}
                        {isSyncingAPI ? "同期中..." : "ElevenLabs KBに同期"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ElevenLabsのKnowledge Base APIと連携し、RAG検索で回答精度が向上します</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {lastSyncedAPI && (
                  <p className="text-xs text-muted-foreground text-center">
                    ElevenLabs KB同期: {lastSyncedAPI.toLocaleTimeString("ja-JP")}
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleSyncKnowledge}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : lastSynced ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isSyncing ? "同期中..." : "プロンプトに同期"}
                </Button>
                {lastSynced && (
                  <p className="text-xs text-muted-foreground text-center">
                    プロンプト同期: {lastSynced.toLocaleTimeString("ja-JP")}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Zap className={`h-3 w-3 ${autoSyncEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-xs text-muted-foreground">
                    {autoSyncEnabled ? '自動同期: オン' : '自動同期: オフ'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
