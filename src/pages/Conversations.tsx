import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Phone,
  PhoneOutgoing,
  Loader2,
  Bot,
  MessageCircle,
} from "lucide-react";
import { useOutboundCalls } from "@/hooks/useOutboundCalls";
import { OutboundCallDialog } from "@/components/outbound/OutboundCallDialog";
import { BatchCallDialog } from "@/components/outbound/BatchCallDialog";
import { useConversations } from "@/hooks/useConversations";
import { useAgents } from "@/hooks/useAgents";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { useWorkspace } from "@/hooks/useWorkspace";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDuration,
  AgentListItem,
  ConversationHistoryTable,
  OutboundAgentListItem,
  OutboundChatView,
  type ConversationDisplay,
  type AgentConversations,
  type ExtractedDataItem,
} from "@/components/conversations";

export default function Conversations() {
  const [activeTab, setActiveTab] = useState<"conversations" | "outbound">("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "in_progress">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedOutboundAgentId, setSelectedOutboundAgentId] = useState<string | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [batchCallDialogOpen, setBatchCallDialogOpen] = useState(false);
  const [callAgentId, setCallAgentId] = useState<string | undefined>(undefined);
  
  const { conversations, isLoading, markAsRead, unreadCount } = useConversations();
  const { 
    outboundCalls, 
    isLoading: isOutboundLoading, 
    cancelCall, 
    markAsRead: markOutboundAsRead, 
    unreadCount: outboundUnreadCount 
  } = useOutboundCalls();
  const { agents } = useAgents();
  const { workspace } = useWorkspace();
  const { phoneNumbers, assignToAgent, unassignFromAgent } = usePhoneNumbers(workspace?.id);

  const handleTabChange = (tab: "conversations" | "outbound") => {
    setActiveTab(tab);
    setSelectedAgentId(null);
    setSelectedOutboundAgentId(null);
  };

  // Fetch extraction fields for field name mapping
  const { data: allExtractionFields = [] } = useQuery({
    queryKey: ["all-extraction-fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("agent_id, field_key, field_name");
      if (error) throw error;
      return data || [];
    },
  });

  const extractionFieldNameMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    allExtractionFields.forEach((field) => {
      if (!map.has(field.agent_id)) {
        map.set(field.agent_id, new Map());
      }
      map.get(field.agent_id)!.set(field.field_key, field.field_name);
    });
    return map;
  }, [allExtractionFields]);

  const handlePhoneAssign = async (agentId: string, phoneNumberSid: string) => {
    if (phoneNumberSid === "none") {
      const current = phoneNumbers.find(p => p.agent_id === agentId);
      if (current) {
        await unassignFromAgent(current.phone_number_sid);
      }
    } else {
      await assignToAgent(phoneNumberSid, agentId);
    }
  };

  const getAgentInfo = (id: string) => {
    const agent = agents.find(a => a.id === id);
    return {
      name: agent?.name || '不明',
      iconName: agent?.icon_name || 'bot',
      iconColor: agent?.icon_color || '#10b981',
    };
  };

  // Transform conversations to display format
  const displayConversations: ConversationDisplay[] = useMemo(() => 
    conversations.map((conv) => ({
      id: conv.id,
      phone: conv.phone_number || '不明',
      agent: conv.agent?.name || '不明なエージェント',
      agentId: conv.agent_id,
      duration: formatDuration(conv.duration_seconds),
      durationSeconds: conv.duration_seconds || 0,
      status: conv.status as 'completed' | 'failed' | 'in_progress',
      outcome: conv.outcome || '-',
      date: format(new Date(conv.started_at), 'yyyy-MM-dd HH:mm', { locale: ja }),
      rawDate: new Date(conv.started_at),
      transcript: conv.transcript,
      audioUrl: conv.audio_url,
      summary: conv.summary,
      keyPoints: conv.key_points || [],
      sentiment: conv.metadata?.sentiment || null,
      actionItems: conv.metadata?.action_items || [],
      iconName: (conv.agent as any)?.icon_name || 'bot',
      iconColor: (conv.agent as any)?.icon_color || '#10b981',
      isRead: conv.is_read,
      extractedData: (() => {
        const items: ExtractedDataItem[] = [];
        const agentFieldMap = extractionFieldNameMap.get(conv.agent_id);
        const extracted = (conv as any).extracted_data;
        if (Array.isArray(extracted)) {
          extracted.forEach((item: { field_key: string; field_value: string }) => {
            items.push({
              field_key: item.field_key,
              field_value: item.field_value || '',
              field_name: agentFieldMap?.get(item.field_key),
            });
          });
        }
        const metadataExtracted = conv.metadata?.extracted_data;
        if (metadataExtracted && typeof metadataExtracted === 'object') {
          Object.entries(metadataExtracted).forEach(([key, value]) => {
            if (!items.find(i => i.field_key === key)) {
              items.push({
                field_key: key,
                field_value: String(value || ''),
                field_name: agentFieldMap?.get(key),
              });
            }
          });
        }
        return items;
      })(),
    })),
    [conversations, extractionFieldNameMap]
  );

  // Group conversations by agent
  const agentConversations: AgentConversations[] = useMemo(() => {
    const groupedMap = new Map<string, ConversationDisplay[]>();
    
    displayConversations.forEach((conv) => {
      const existing = groupedMap.get(conv.agentId) || [];
      existing.push(conv);
      groupedMap.set(conv.agentId, existing);
    });

    return Array.from(groupedMap.entries())
      .map(([agentId, convs]) => {
        const sorted = convs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        const assignedPhone = phoneNumbers.find(p => p.agent_id === agentId);
        const unreadConvs = sorted.filter(c => !c.isRead);
        return {
          agentId,
          agentName: sorted[0].agent,
          conversations: sorted,
          lastConversation: sorted[0],
          totalConversations: sorted.length,
          unreadCount: unreadConvs.length,
          iconName: sorted[0].iconName,
          iconColor: sorted[0].iconColor,
          phoneNumber: assignedPhone?.phone_number,
        };
      })
      .sort((a, b) => b.lastConversation.rawDate.getTime() - a.lastConversation.rawDate.getTime());
  }, [displayConversations, phoneNumbers]);

  // Group outbound calls by agent
  const agentOutboundCalls = useMemo(() => {
    const groupedMap = new Map<string, typeof outboundCalls>();
    
    outboundCalls.forEach((call) => {
      const existing = groupedMap.get(call.agent_id) || [];
      existing.push(call);
      groupedMap.set(call.agent_id, existing);
    });

    return Array.from(groupedMap.entries())
      .map(([agentId, calls]) => {
        const sorted = calls.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const agentInfo = getAgentInfo(agentId);
        const unreadCalls = sorted.filter(c => !c.is_read);
        return {
          agentId,
          agentName: agentInfo.name,
          calls: sorted,
          lastCall: sorted[0],
          totalCalls: sorted.length,
          unreadCount: unreadCalls.length,
          iconName: agentInfo.iconName,
          iconColor: agentInfo.iconColor,
        };
      })
      .sort((a, b) => 
        new Date(b.lastCall.created_at).getTime() - new Date(a.lastCall.created_at).getTime()
      );
  }, [outboundCalls, agents]);

  const filteredAgents = agentConversations.filter((agent) =>
    agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.conversations.some(c => c.phone.includes(searchQuery))
  );

  const filteredOutboundAgents = agentOutboundCalls.filter((agent) =>
    agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.calls.some(c => c.to_number.includes(searchQuery))
  );

  const selectedAgent = agentConversations.find(a => a.agentId === selectedAgentId);
  const selectedOutboundAgent = agentOutboundCalls.find(a => a.agentId === selectedOutboundAgentId);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
        {/* Left Panel */}
        <div 
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-background ${
            (activeTab === "conversations" && selectedAgentId) || (activeTab === "outbound" && selectedOutboundAgentId) ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-[#06C755] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-foreground">AI通話履歴</h1>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "conversations" 
                    ? `${agentConversations.length}件のエージェント`
                    : `${agentOutboundCalls.length}件のエージェント`
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-3">
              <Button 
                className="flex-1 h-9 text-sm gap-1.5"
                onClick={() => {
                  setCallAgentId(undefined);
                  setCallDialogOpen(true);
                }}
              >
                <PhoneOutgoing className="h-4 w-4" />
                新規発信
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-9 text-sm gap-1.5"
                onClick={() => setBatchCallDialogOpen(true)}
              >
                <Phone className="h-4 w-4" />
                一斉発信
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="エージェント名または電話番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-0 rounded-xl"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "conversations" | "outbound")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50 rounded-xl">
                <TabsTrigger value="conversations" className="rounded-lg gap-1.5 text-sm data-[state=active]:bg-background relative">
                  <Phone className="h-4 w-4" />
                  受信履歴
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="outbound" className="rounded-lg gap-1.5 text-sm data-[state=active]:bg-background relative">
                  <PhoneOutgoing className="h-4 w-4" />
                  発信履歴
                  {outboundUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground">
                      {outboundUnreadCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {activeTab === "conversations" ? (
              isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-16 px-4 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">会話履歴がありません</p>
                  <p className="text-sm mt-1">エージェントと通話すると、<br />ここに表示されます</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredAgents.map((agent) => (
                    <AgentListItem
                      key={agent.agentId}
                      agent={agent}
                      isSelected={selectedAgentId === agent.agentId}
                      onClick={() => setSelectedAgentId(agent.agentId)}
                      onCall={() => {
                        setCallAgentId(agent.agentId);
                        setCallDialogOpen(true);
                      }}
                      phoneNumbers={phoneNumbers}
                      onPhoneAssign={handlePhoneAssign}
                    />
                  ))}
                </div>
              )
            ) : (
              isOutboundLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                </div>
              ) : filteredOutboundAgents.length === 0 ? (
                <div className="text-center py-16 px-4 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <PhoneOutgoing className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">発信履歴がありません</p>
                  <p className="text-sm mt-1">発信すると、ここに表示されます</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredOutboundAgents.map((agent) => (
                    <OutboundAgentListItem
                      key={agent.agentId}
                      agent={agent}
                      isSelected={selectedOutboundAgentId === agent.agentId}
                      onClick={() => setSelectedOutboundAgentId(agent.agentId)}
                      onCall={() => {
                        setCallAgentId(agent.agentId);
                        setCallDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Chat View */}
        <div 
          className={`flex-1 bg-muted/20 ${
            (activeTab === "conversations" && selectedAgentId) || (activeTab === "outbound" && selectedOutboundAgentId) ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeTab === "conversations" && selectedAgent ? (
            <ConversationHistoryTable 
              agent={selectedAgent}
              onBack={() => setSelectedAgentId(null)}
              dateFilter={dateFilter}
              statusFilter={statusFilter}
              setDateFilter={setDateFilter}
              setStatusFilter={setStatusFilter}
              onMarkAsRead={markAsRead}
            />
          ) : activeTab === "outbound" && selectedOutboundAgent ? (
            <OutboundChatView
              agent={selectedOutboundAgent}
              onBack={() => setSelectedOutboundAgentId(null)}
              cancelCall={cancelCall}
              onMarkAsRead={markOutboundAsRead}
              extractionFieldNameMap={extractionFieldNameMap}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-10 w-10 opacity-20" />
                </div>
                <p className="text-lg font-medium">トークを選択</p>
                <p className="text-sm mt-1">左のリストからエージェントを選んでください</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <OutboundCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        defaultAgentId={callAgentId}
      />
      <BatchCallDialog
        open={batchCallDialogOpen}
        onOpenChange={setBatchCallDialogOpen}
      />
    </AppLayout>
  );
}
