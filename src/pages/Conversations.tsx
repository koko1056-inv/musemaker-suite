import { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Phone,
  PhoneOutgoing,
  PhoneOff,
  Clock,
  CheckCircle,
  CheckCircle2,
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
  X,
  History,
} from "lucide-react";
import { useOutboundCalls } from "@/hooks/useOutboundCalls";
import { OutboundCallDialog } from "@/components/outbound/OutboundCallDialog";
import { BatchCallDialog } from "@/components/outbound/BatchCallDialog";
import { useConversations } from "@/hooks/useConversations";
import { useAgents } from "@/hooks/useAgents";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { useWorkspace } from "@/hooks/useWorkspace";
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
  phoneNumber?: string;
}

interface PhoneNumberInfo {
  phone_number: string;
  phone_number_sid: string;
  label: string | null;
  agent_id: string | null;
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
  const [isLoaded, setIsLoaded] = useState(false);

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
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
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

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-muted/50 rounded-full px-3 sm:px-4 py-2 max-w-[280px] w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full shrink-0"
        onClick={togglePlayPause}
        disabled={!isLoaded}
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
          max={duration || 1}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
          disabled={!isLoaded}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{isLoaded ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}

// Agent List Item Component - LINE style
function AgentListItem({ 
  agent, 
  isSelected, 
  onClick,
  onCall,
  phoneNumbers,
  onPhoneAssign,
}: { 
  agent: AgentConversations;
  isSelected: boolean;
  onClick: () => void;
  onCall: () => void;
  phoneNumbers: PhoneNumberInfo[];
  onPhoneAssign: (agentId: string, phoneNumberSid: string) => void;
}) {
  const lastConv = agent.lastConversation;
  const IconComponent = getAgentIcon(agent.iconName);
  const assignedPhone = phoneNumbers.find(p => p.agent_id === agent.agentId);
  
  return (
    <div
      className={`px-4 py-3 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/8' 
          : 'hover:bg-muted/50 active:bg-muted/70'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
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

        {/* Call Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0 text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
        >
          <PhoneOutgoing className="h-4 w-4" />
        </Button>

        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>

      {/* Phone Number Assignment */}
      {phoneNumbers.length > 0 && (
        <div className="mt-2 ml-15 pl-[60px]" onClick={(e) => e.stopPropagation()}>
          <Select
            value={assignedPhone?.phone_number_sid || "none"}
            onValueChange={(value) => onPhoneAssign(agent.agentId, value)}
          >
            <SelectTrigger className="h-8 text-xs w-full max-w-[200px]">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <SelectValue>
                  {assignedPhone ? (
                    <span className="font-mono text-xs">{assignedPhone.phone_number}</span>
                  ) : (
                    <span className="text-muted-foreground">電話番号を割り当て</span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">未割り当て</span>
              </SelectItem>
              {phoneNumbers.map((phone) => (
                <SelectItem 
                  key={phone.phone_number_sid} 
                  value={phone.phone_number_sid}
                  disabled={phone.agent_id !== null && phone.agent_id !== agent.agentId}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{phone.phone_number}</span>
                    {phone.label && (
                      <span className="text-muted-foreground text-xs">({phone.label})</span>
                    )}
                    {phone.agent_id && phone.agent_id !== agent.agentId && (
                      <span className="text-muted-foreground text-xs">(使用中)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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

// Outbound Call Status Badge Component
function OutboundStatusBadge({ status, result }: { status: string; result?: string | null }) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs h-6">
          <Calendar className="h-3 w-3" />
          予約済み
        </Badge>
      );
    case 'initiating':
    case 'ringing':
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs h-6">
          <Loader2 className="h-3 w-3 animate-spin" />
          発信中
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 border-green-500/20 text-xs h-6">
          <Phone className="h-3 w-3" />
          通話中
        </Badge>
      );
    case 'completed':
      if (result === 'answered') {
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 border-green-500/20 text-xs h-6">
            <CheckCircle2 className="h-3 w-3" />
            完了
          </Badge>
        );
      } else if (result === 'busy') {
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs h-6">
            <PhoneOff className="h-3 w-3" />
            話し中
          </Badge>
        );
      } else if (result === 'no_answer') {
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs h-6">
            <Clock className="h-3 w-3" />
            応答なし
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs h-6">
          <CheckCircle2 className="h-3 w-3" />
          完了
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1 font-normal text-xs h-6">
          <XCircle className="h-3 w-3" />
          失敗
        </Badge>
      );
    case 'canceled':
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs h-6">
          <X className="h-3 w-3" />
          キャンセル
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="font-normal text-xs h-6">{status}</Badge>;
  }
}

export default function Conversations() {
  const [activeTab, setActiveTab] = useState<"conversations" | "outbound">("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "in_progress">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [batchCallDialogOpen, setBatchCallDialogOpen] = useState(false);
  const [callAgentId, setCallAgentId] = useState<string | undefined>(undefined);
  const { conversations, isLoading } = useConversations();
  const { outboundCalls, isLoading: isOutboundLoading, cancelCall } = useOutboundCalls();
  const { agents } = useAgents();
  const { workspace } = useWorkspace();
  const { phoneNumbers, assignToAgent, unassignFromAgent } = usePhoneNumbers(workspace?.id);

  // Get phone number for an agent
  const getAgentPhoneNumber = (agentId: string) => {
    return phoneNumbers.find(p => p.agent_id === agentId);
  };

  // Handle phone number assignment
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

  const getAgentName = (id: string) => {
    const agent = agents.find(a => a.id === id);
    return agent?.name || '不明';
  };

  const getAgentInfo = (id: string) => {
    const agent = agents.find(a => a.id === id);
    return {
      name: agent?.name || '不明',
      iconName: agent?.icon_name || 'bot',
      iconColor: agent?.icon_color || '#10b981',
    };
  };

  const formatOutboundDuration = (seconds?: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        const assignedPhone = phoneNumbers.find(p => p.agent_id === agentId);
        return {
          agentId,
          agentName: sorted[0].agent,
          conversations: sorted,
          lastConversation: sorted[0],
          totalConversations: sorted.length,
          iconName: sorted[0].iconName,
          iconColor: sorted[0].iconColor,
          phoneNumber: assignedPhone?.phone_number,
        };
      })
      .sort((a, b) => b.lastConversation.rawDate.getTime() - a.lastConversation.rawDate.getTime());
  }, [displayConversations, phoneNumbers]);

  // Filter agents by search
  const filteredAgents = agentConversations.filter((agent) =>
    agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.conversations.some(c => c.phone.includes(searchQuery))
  );

  const selectedAgent = agentConversations.find(a => a.agentId === selectedAgentId);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
        {/* Left Panel */}
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
              <div className="flex-1">
                <h1 className="text-lg font-bold text-foreground">AI通話履歴</h1>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "conversations" 
                    ? `${agentConversations.length}件のエージェント`
                    : `${outboundCalls.length}件の発信`
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
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-0 rounded-xl"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "conversations" | "outbound")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50 rounded-xl">
              <TabsTrigger value="conversations" className="rounded-lg gap-1.5 text-sm data-[state=active]:bg-background">
                  <Phone className="h-4 w-4" />
                  受信履歴
                </TabsTrigger>
                <TabsTrigger value="outbound" className="rounded-lg gap-1.5 text-sm data-[state=active]:bg-background">
                  <PhoneOutgoing className="h-4 w-4" />
                  発信履歴
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content based on active tab */}
          <ScrollArea className="flex-1">
            {activeTab === "conversations" ? (
              // Conversation List
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
              // Outbound Calls List
              isOutboundLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                </div>
              ) : outboundCalls.length === 0 ? (
                <div className="text-center py-16 px-4 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <PhoneOutgoing className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">発信履歴がありません</p>
                  <p className="text-sm mt-1">発信すると、ここに表示されます</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {outboundCalls
                    .filter(call => 
                      call.to_number.includes(searchQuery) ||
                      getAgentName(call.agent_id).toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((call) => {
                      const agentInfo = getAgentInfo(call.agent_id);
                      const IconComponent = getAgentIcon(agentInfo.iconName);
                      
                      return (
                        <div
                          key={call.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {/* Agent Icon */}
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: agentInfo.iconColor }}
                          >
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-sm">{call.to_number}</span>
                              <OutboundStatusBadge status={call.status} result={call.result} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{agentInfo.name}</span>
                              <span>
                                {call.scheduled_at
                                  ? format(new Date(call.scheduled_at), 'M/d HH:mm', { locale: ja })
                                  : format(new Date(call.created_at), 'M/d HH:mm', { locale: ja })}
                              </span>
                              {call.duration_seconds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatOutboundDuration(call.duration_seconds)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Cancel Button */}
                          {(call.status === 'scheduled' || call.status === 'initiating') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelCall(call.id)}
                              className="rounded-xl text-xs text-muted-foreground hover:text-destructive shrink-0"
                            >
                              キャンセル
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )
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

      {/* Outbound Call Dialog */}
      <OutboundCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        defaultAgentId={callAgentId}
      />

      {/* Batch Call Dialog */}
      <BatchCallDialog
        open={batchCallDialogOpen}
        onOpenChange={setBatchCallDialogOpen}
      />
    </AppLayout>
  );
}
