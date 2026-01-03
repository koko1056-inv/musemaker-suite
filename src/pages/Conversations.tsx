import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
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
} from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";

interface TranscriptMessage {
  role: 'agent' | 'user';
  text: string;
}

interface ConversationDisplay {
  id: string;
  phone: string;
  agent: string;
  duration: string;
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
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
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

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "in_progress">("all");
  const [selectedConversation, setSelectedConversation] = useState<ConversationDisplay | null>(null);
  const { conversations, isLoading } = useConversations();

  // Transform DB data to display format
  const displayConversations: ConversationDisplay[] = conversations.map((conv) => ({
    id: conv.id,
    phone: conv.phone_number || '不明',
    agent: conv.agent?.name || '不明なエージェント',
    duration: formatDuration(conv.duration_seconds),
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
  }));

  const filteredConversations = displayConversations.filter((conv) => {
    // Text search
    const matchesSearch = conv.phone.includes(searchQuery) ||
      conv.agent.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    
    // Date filter
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

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-8 mobile-safe-bottom">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">会話履歴</h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            すべての音声エージェントの会話を表示・分析
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="電話番号またはエージェントで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">期間:</span>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "すべて" },
                  { value: "today", label: "今日" },
                  { value: "week", label: "今週" },
                  { value: "month", label: "今月" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={dateFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter(option.value as typeof dateFilter)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">ステータス:</span>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "すべて" },
                  { value: "completed", label: "完了" },
                  { value: "in_progress", label: "進行中" },
                  { value: "failed", label: "失敗" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(option.value as typeof statusFilter)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(searchQuery || dateFilter !== "all" || statusFilter !== "all") && (
            <p className="text-sm text-muted-foreground">
              {filteredConversations.length}件の会話が見つかりました
            </p>
          )}
        </div>

        {/* Table */}
        <div className="glass rounded-xl card-shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              会話履歴がありません
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredConversations.map((conv, index) => (
                  <div
                    key={conv.id}
                    className="glass rounded-xl p-4 card-shadow animate-fade-in cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{conv.phone}</span>
                      </div>
                      <Badge
                        variant={conv.status === "completed" ? "default" : conv.status === "in_progress" ? "secondary" : "destructive"}
                        className="gap-1"
                      >
                        {conv.status === "completed" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : conv.status === "in_progress" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {conv.status === "completed" ? "完了" : conv.status === "in_progress" ? "進行中" : "失敗"}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">{conv.agent}</div>
                    
                    {conv.summary && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-primary/5">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm line-clamp-2">{conv.summary}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {conv.duration}
                      </div>
                      <span>{conv.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>電話番号</TableHead>
                    <TableHead>エージェント</TableHead>
                    <TableHead>通話時間</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>AI要約</TableHead>
                    <TableHead>日時</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conv, index) => (
                    <TableRow
                      key={conv.id}
                      className="border-border/50 animate-fade-in cursor-pointer hover:bg-accent/50"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{conv.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>{conv.agent}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {conv.duration}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={conv.status === "completed" ? "default" : conv.status === "in_progress" ? "secondary" : "destructive"}
                          className="gap-1"
                        >
                          {conv.status === "completed" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : conv.status === "in_progress" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {conv.status === "completed" ? "完了" : conv.status === "in_progress" ? "進行中" : "失敗"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {conv.summary ? (
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm truncate">{conv.summary}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{conv.date}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConversation(conv);
                          }}
                        >
                          <Play className="h-4 w-4" />
                          表示
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>

        {/* Conversation Detail Dialog */}
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {selectedConversation?.phone}
              </DialogTitle>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">エージェント</p>
                    <p className="font-medium">{selectedConversation.agent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">通話時間</p>
                    <p className="font-medium">{selectedConversation.duration}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">結果</p>
                    <p className="font-medium">{selectedConversation.outcome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">日時</p>
                    <p className="font-medium">{selectedConversation.date}</p>
                  </div>
                </div>

                {/* AI Summary Section */}
                {selectedConversation.summary && (
                  <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">AI要約</span>
                      {selectedConversation.sentiment && (
                        <Badge 
                          variant={
                            selectedConversation.sentiment === 'positive' ? 'default' :
                            selectedConversation.sentiment === 'negative' ? 'destructive' : 'secondary'
                          }
                          className="gap-1 ml-auto"
                        >
                          {selectedConversation.sentiment === 'positive' && <TrendingUp className="h-3 w-3" />}
                          {selectedConversation.sentiment === 'negative' && <TrendingDown className="h-3 w-3" />}
                          {selectedConversation.sentiment === 'neutral' && <Minus className="h-3 w-3" />}
                          {selectedConversation.sentiment === 'positive' ? 'ポジティブ' :
                           selectedConversation.sentiment === 'negative' ? 'ネガティブ' : 'ニュートラル'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{selectedConversation.summary}</p>
                    
                    {selectedConversation.keyPoints.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          重要ポイント
                        </div>
                        <ul className="space-y-1 text-sm">
                          {selectedConversation.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedConversation.actionItems.length > 0 && (
                      <div className="space-y-2 border-t border-border/50 pt-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          アクションアイテム
                        </div>
                        <ul className="space-y-1 text-sm">
                          {selectedConversation.actionItems.map((item, i) => (
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
                {selectedConversation.audioUrl && (
                  <AudioPlayer audioUrl={selectedConversation.audioUrl} />
                )}

                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-4">トランスクリプト</h4>
                  <div className="space-y-3">
                    {selectedConversation.transcript.length > 0 ? (
                      selectedConversation.transcript.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "agent"
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {msg.role === "agent" ? "エージェント" : "お客様"}
                            </p>
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
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
