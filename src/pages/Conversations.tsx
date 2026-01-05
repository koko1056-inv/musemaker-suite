import { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  Pause,
  Volume2,
  FileText,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Bot,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";

interface TranscriptMessage {
  role: 'agent' | 'user';
  text: string;
}

interface ConversationDisplay {
  id: string;
  phone: string;
  agent: string;
  agentId: string;
  duration: string;
  durationSeconds: number;
  status: 'completed' | 'failed' | 'in_progress';
  outcome: string;
  date: string;
  rawDate: Date;
  transcript: TranscriptMessage[];
  audioUrl: string | null;
  summary: string | null;
  keyPoints: string[];
  sentiment: string | null;
  actionItems: string[];
  iconName: string;
  iconColor: string;
}

interface AgentConversations {
  agentId: string;
  agentName: string;
  conversations: ConversationDisplay[];
  lastConversation: ConversationDisplay;
  totalConversations: number;
  iconName: string;
  iconColor: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: ja });
  }
  if (isYesterday(date)) {
    return '昨日';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE', { locale: ja });
  }
  return format(date, 'yyyy/MM/dd', { locale: ja });
}


function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="bg-background/80 rounded-2xl p-4 space-y-3 mx-4 mb-4">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">通話録音</span>
      </div>
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        
        <div className="flex-1 space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Agent List Item Component
function AgentListItem({ 
  agent, 
  isSelected, 
  onClick 
}: { 
  agent: AgentConversations;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastConv = agent.lastConversation;
  const IconComponent = getAgentIcon(agent.iconName);
  
  return (
    <div
      className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-border/30 ${
        isSelected 
          ? 'bg-primary/10' 
          : 'hover:bg-muted/50 active:bg-muted'
      }`}
      onClick={onClick}
    >
      {/* Agent Avatar */}
      <div className="relative">
        <div 
          className="h-14 w-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-7 w-7 text-white" />
        </div>
        {lastConv.status === 'in_progress' && (
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-foreground truncate">
            {agent.agentName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeDate(lastConv.rawDate)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            {lastConv.summary ? (
              <p className="text-sm text-muted-foreground truncate">
                {lastConv.summary}
              </p>
            ) : lastConv.transcript.length > 0 ? (
              <p className="text-sm text-muted-foreground truncate">
                {lastConv.transcript[lastConv.transcript.length - 1]?.text || '通話記録あり'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Phone className="h-3 w-3" />
                通話時間 {lastConv.duration}
              </p>
            )}
          </div>
          
          {/* Badge */}
          {agent.totalConversations > 1 && (
            <Badge variant="secondary" className="shrink-0 h-5 min-w-[20px] text-xs">
              {agent.totalConversations}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Chat View Component
function ChatView({ 
  agent,
  onBack,
  dateFilter,
  statusFilter,
  setDateFilter,
  setStatusFilter,
}: { 
  agent: AgentConversations;
  onBack: () => void;
  dateFilter: string;
  statusFilter: string;
  setDateFilter: (value: "all" | "today" | "week" | "month") => void;
  setStatusFilter: (value: "all" | "completed" | "failed" | "in_progress") => void;
}) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const IconComponent = getAgentIcon(agent.iconName);
  
  // Filter conversations for this agent
  const filteredConversations = agent.conversations.filter((conv) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = conv.rawDate >= today;
    } else if (dateFilter === "week") {
      matchesDate = conv.rawDate >= weekAgo;
    } else if (dateFilter === "month") {
      matchesDate = conv.rawDate >= monthAgo;
    }

    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    
    return matchesDate && matchesStatus;
  });

  const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-background border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{agent.agentName}</h2>
          <p className="text-xs text-muted-foreground">
            {agent.totalConversations}件の会話
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 bg-background/50 border-b border-border/50">
        <div className="flex gap-1">
          {[
            { value: "all" as const, label: "すべて" },
            { value: "today" as const, label: "今日" },
            { value: "week" as const, label: "今週" },
            { value: "month" as const, label: "今月" },
          ].map((option) => (
            <Button
              key={option.value}
              variant={dateFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter(option.value)}
              className="text-xs h-7 px-2"
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {[
            { value: "all" as const, label: "全状況", icon: null },
            { value: "completed" as const, label: "完了", icon: CheckCircle },
            { value: "in_progress" as const, label: "進行中", icon: Clock },
            { value: "failed" as const, label: "失敗", icon: XCircle },
          ].map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(option.value)}
              className="text-xs h-7 px-2 gap-1"
            >
              {option.icon && <option.icon className="h-3 w-3" />}
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversation List & Chat */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>該当する会話がありません</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationCard 
                key={conv.id} 
                conversation={conv}
                isExpanded={selectedConversationId === conv.id}
                onToggle={() => setSelectedConversationId(
                  selectedConversationId === conv.id ? null : conv.id
                )}
                agentIconName={agent.iconName}
                agentIconColor={agent.iconColor}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Conversation Card Component
function ConversationCard({
  conversation,
  isExpanded,
  onToggle,
  agentIconName,
  agentIconColor,
}: {
  conversation: ConversationDisplay;
  isExpanded: boolean;
  onToggle: () => void;
  agentIconName: string;
  agentIconColor: string;
}) {
  const IconComponent = getAgentIcon(agentIconName);
  return (
    <div 
      className={`bg-background rounded-2xl overflow-hidden transition-all duration-300 ${
        isExpanded ? 'ring-2 ring-primary/30' : 'hover:bg-background/80'
      }`}
    >
      {/* Card Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(conversation.rawDate, 'yyyy年M月d日 HH:mm', { locale: ja })}
            </span>
          </div>
          <Badge
            variant={
              conversation.status === "completed" ? "default" : 
              conversation.status === "in_progress" ? "secondary" : "destructive"
            }
            className="gap-1 text-xs"
          >
            {conversation.status === "completed" ? (
              <CheckCircle className="h-3 w-3" />
            ) : conversation.status === "in_progress" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {conversation.status === "completed" ? "完了" : 
             conversation.status === "in_progress" ? "進行中" : "失敗"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            {conversation.phone}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {conversation.duration}
          </span>
        </div>

        {/* Summary Preview */}
        {conversation.summary && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 mt-2">
            <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
              {conversation.summary}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border/50">
          {/* AI Analysis */}
          {(conversation.keyPoints.length > 0 || conversation.actionItems.length > 0 || conversation.sentiment) && (
            <div className="p-4 bg-primary/5 space-y-3">
              {conversation.sentiment && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">センチメント:</span>
                  <Badge 
                    variant={
                      conversation.sentiment === 'positive' ? 'default' :
                      conversation.sentiment === 'negative' ? 'destructive' : 'secondary'
                    }
                    className="gap-1"
                  >
                    {conversation.sentiment === 'positive' && <TrendingUp className="h-3 w-3" />}
                    {conversation.sentiment === 'negative' && <TrendingDown className="h-3 w-3" />}
                    {conversation.sentiment === 'neutral' && <Minus className="h-3 w-3" />}
                    {conversation.sentiment === 'positive' ? 'ポジティブ' :
                     conversation.sentiment === 'negative' ? 'ネガティブ' : 'ニュートラル'}
                  </Badge>
                </div>
              )}
              
              {conversation.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    重要ポイント
                  </div>
                  <ul className="space-y-1 text-sm ml-6">
                    {conversation.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {conversation.actionItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    アクションアイテム
                  </div>
                  <ul className="space-y-1 text-sm ml-6">
                    {conversation.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">□</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Audio Player */}
          {conversation.audioUrl && (
            <AudioPlayer audioUrl={conversation.audioUrl} />
          )}

          {/* Transcript - Chat Style */}
          <div className="p-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              トランスクリプト
            </h4>
            <div className="space-y-3">
              {conversation.transcript.length > 0 ? (
                conversation.transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
                  >
                    {msg.role === "agent" && (
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center mr-2 shrink-0"
                        style={{ backgroundColor: agentIconColor }}
                      >
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.role === "agent"
                          ? "bg-muted text-foreground rounded-tl-md"
                          : "bg-primary text-primary-foreground rounded-tr-md"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  トランスクリプトがありません
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "in_progress">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { conversations, isLoading } = useConversations();

  // Transform DB data to display format
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
    })),
    [conversations]
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
        return {
          agentId,
          agentName: sorted[0].agent,
          conversations: sorted,
          lastConversation: sorted[0],
          totalConversations: sorted.length,
          iconName: sorted[0].iconName,
          iconColor: sorted[0].iconColor,
        };
      })
      .sort((a, b) => b.lastConversation.rawDate.getTime() - a.lastConversation.rawDate.getTime());
  }, [displayConversations]);

  // Filter agents by search
  const filteredAgents = agentConversations.filter((agent) =>
    agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.conversations.some(c => c.phone.includes(searchQuery))
  );

  const selectedAgent = agentConversations.find(a => a.agentId === selectedAgentId);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex bg-background">
        {/* Agent List (Left Panel) */}
        <div 
          className={`w-full md:w-96 lg:w-[420px] flex flex-col border-r border-border bg-background ${
            selectedAgentId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">トーク</h1>
                <p className="text-xs text-muted-foreground">
                  {agentConversations.length}件のエージェント
                </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="エージェントや電話番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Agent List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-16 px-4 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">会話履歴がありません</p>
                <p className="text-sm mt-1">エージェントと通話すると、ここに表示されます</p>
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <AgentListItem
                  key={agent.agentId}
                  agent={agent}
                  isSelected={selectedAgentId === agent.agentId}
                  onClick={() => setSelectedAgentId(agent.agentId)}
                />
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat View (Right Panel) */}
        <div 
          className={`flex-1 ${
            selectedAgentId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedAgent ? (
            <ChatView 
              agent={selectedAgent}
              onBack={() => setSelectedAgentId(null)}
              dateFilter={dateFilter}
              statusFilter={statusFilter}
              setDateFilter={setDateFilter}
              setStatusFilter={setStatusFilter}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/10">
              <div className="text-center text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-10 w-10 opacity-30" />
                </div>
                <p className="text-lg font-medium">エージェントを選択</p>
                <p className="text-sm mt-1">左のリストからエージェントを選んでください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
