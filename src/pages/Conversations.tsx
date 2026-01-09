import { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronRight,
  User,
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
  return format(date, 'M/d', { locale: ja });
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
    <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 max-w-[280px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full shrink-0"
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
      
      <div className="flex-1 space-y-0.5 min-w-0">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      </div>
    </div>
  );
}

// Agent List Item Component - LINE style
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
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/8' 
          : 'hover:bg-muted/50 active:bg-muted/70'
      }`}
      onClick={onClick}
    >
      {/* Agent Avatar */}
      <div className="relative shrink-0">
        <div 
          className="h-12 w-12 rounded-full flex items-center justify-center shadow-sm"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        {agent.totalConversations > 1 && (
          <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">{agent.totalConversations}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground truncate">
            {agent.agentName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeDate(lastConv.rawDate)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {lastConv.summary 
            ? lastConv.summary 
            : lastConv.transcript.length > 0 
              ? lastConv.transcript[lastConv.transcript.length - 1]?.text 
              : `通話時間 ${lastConv.duration}`
          }
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </div>
  );
}

// Chat Message Bubble
function ChatBubble({ 
  message, 
  isAgent, 
  agentIcon, 
  agentColor,
  showAvatar 
}: { 
  message: TranscriptMessage;
  isAgent: boolean;
  agentIcon: string;
  agentColor: string;
  showAvatar: boolean;
}) {
  const IconComponent = getAgentIcon(agentIcon);
  
  return (
    <div className={`flex gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}>
      {isAgent && showAvatar && (
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: agentColor }}
        >
          <IconComponent className="h-4 w-4 text-white" />
        </div>
      )}
      {isAgent && !showAvatar && <div className="w-8 shrink-0" />}
      
      <div
        className={`max-w-[75%] px-4 py-2.5 ${
          isAgent
            ? 'bg-muted rounded-2xl rounded-tl-md'
            : 'bg-[#06C755] text-white rounded-2xl rounded-tr-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}

// Conversation Detail Component
function ConversationDetail({
  conversation,
  agentIconName,
  agentIconColor,
}: {
  conversation: ConversationDisplay;
  agentIconName: string;
  agentIconColor: string;
}) {
  const hasTranscript = conversation.transcript && conversation.transcript.length > 0;
  const hasSummary = conversation.summary && conversation.summary.trim().length > 0;
  const hasKeyPoints = conversation.keyPoints && conversation.keyPoints.length > 0;
  const hasActionItems = conversation.actionItems && conversation.actionItems.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary Card - only show if there's actual summary */}
      {hasSummary && (
        <div className="bg-muted/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">AI要約</p>
              <p className="text-sm leading-relaxed">{conversation.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Points & Action Items - only show if data exists */}
      {(hasKeyPoints || hasActionItems) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {hasKeyPoints && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">重要ポイント</span>
              </div>
              <ul className="space-y-1.5">
                {conversation.keyPoints.map((point, i) => (
                  <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {hasActionItems && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">アクション</span>
              </div>
              <ul className="space-y-1.5">
                {conversation.actionItems.map((item, i) => (
                  <li key={i} className="text-sm text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">□</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Audio Player - only show if audio URL exists */}
      {conversation.audioUrl && (
        <div className="flex justify-center">
          <AudioPlayer audioUrl={conversation.audioUrl} />
        </div>
      )}

      {/* Chat Transcript - only show if transcript exists */}
      {hasTranscript && (
        <div className="space-y-2">
          {conversation.transcript.map((msg, i, arr) => {
            const prevMsg = arr[i - 1];
            const showAvatar = !prevMsg || prevMsg.role !== msg.role;
            
            return (
              <ChatBubble
                key={i}
                message={msg}
                isAgent={msg.role === 'agent'}
                agentIcon={agentIconName}
                agentColor={agentIconColor}
                showAvatar={showAvatar}
              />
            );
          })}
        </div>
      )}
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
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header - LINE style */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-background border-b border-border sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div 
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shadow-sm shrink-0"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate text-sm sm:text-base">{agent.agentName}</h2>
          <p className="text-xs text-muted-foreground">
            {agent.totalConversations}件の会話
          </p>
        </div>
      </div>

      {/* Filter Pills - Clean horizontal scroll */}
      <div className="border-b border-border bg-muted/30">
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3">
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
                className={`text-xs h-7 sm:h-8 px-3 sm:px-4 rounded-full whitespace-nowrap ${
                  dateFilter === option.value 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {option.label}
              </Button>
            ))}
            <div className="w-px bg-border mx-0.5 sm:mx-1" />
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`text-xs h-7 sm:h-8 px-3 sm:px-4 rounded-full whitespace-nowrap ${
                statusFilter === "all" 
                  ? 'bg-foreground text-background hover:bg-foreground/90' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              全状況
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">該当する会話がありません</p>
              <p className="text-sm mt-1">フィルターを調整してください</p>
            </div>
          ) : (
            filteredConversations.map((conv, index) => {
              const isExpanded = selectedConversationId === conv.id;
              const showDateSeparator = index === 0 || 
                format(conv.rawDate, 'yyyy-MM-dd') !== format(filteredConversations[index - 1].rawDate, 'yyyy-MM-dd');
              
              return (
                <div key={conv.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                        {isToday(conv.rawDate) ? '今日' : 
                         isYesterday(conv.rawDate) ? '昨日' : 
                         format(conv.rawDate, 'M月d日（E）', { locale: ja })}
                      </div>
                    </div>
                  )}
                  
                  {/* Conversation Card */}
                  <div 
                    className={`bg-muted/30 rounded-2xl overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'ring-1 ring-primary/20' : 'hover:bg-muted/50 cursor-pointer'
                    }`}
                  >
                    {/* Collapsed Header */}
                    <div 
                      className="flex items-center gap-3 p-3 sm:p-4"
                      onClick={() => setSelectedConversationId(isExpanded ? null : conv.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-sm flex-wrap">
                          <span className="font-medium">
                            {format(conv.rawDate, 'HH:mm')}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {conv.duration}
                          </span>
                          {conv.phone !== '不明' && (
                            <span className="text-muted-foreground text-xs hidden sm:inline">{conv.phone}</span>
                          )}
                        </div>
                        {conv.summary && (
                          <p className={`text-sm text-muted-foreground mt-1 ${isExpanded ? '' : 'line-clamp-1'}`}>
                            {conv.summary}
                          </p>
                        )}
                        {!conv.summary && conv.transcript.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {conv.transcript[0]?.text}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          conv.status === "completed" ? "default" : 
                          conv.status === "in_progress" ? "secondary" : "destructive"
                        }
                        className="shrink-0 gap-1 text-xs h-6"
                      >
                        {conv.status === "completed" ? <CheckCircle className="h-3 w-3" /> : 
                         conv.status === "in_progress" ? <Clock className="h-3 w-3" /> : 
                         <XCircle className="h-3 w-3" />}
                        <span className="hidden sm:inline">
                          {conv.status === "completed" ? "完了" : 
                           conv.status === "in_progress" ? "通話中" : "失敗"}
                        </span>
                      </Badge>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border/50">
                        <div className="pt-3 sm:pt-4">
                          <ConversationDetail
                            conversation={conv}
                            agentIconName={agent.iconName}
                            agentIconColor={agent.iconColor}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
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
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
        {/* Agent List (Left Panel) - LINE style */}
        <div 
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-background ${
            selectedAgentId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-[#06C755] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">トーク</h1>
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
                className="pl-10 h-10 bg-muted/50 border-0 rounded-xl"
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
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat View (Right Panel) */}
        <div 
          className={`flex-1 bg-muted/20 ${
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
    </AppLayout>
  );
}
