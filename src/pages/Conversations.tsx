import { useState } from "react";
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
} from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

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
  transcript: TranscriptMessage[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState("");
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
    transcript: conv.transcript,
  }));

  const filteredConversations = displayConversations.filter(
    (conv) =>
      conv.phone.includes(searchQuery) ||
      conv.agent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">会話履歴</h1>
          <p className="mt-1 text-muted-foreground">
            すべての音声エージェントの会話を表示・分析
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="電話番号またはエージェントで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            フィルター
          </Button>
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
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>電話番号</TableHead>
                  <TableHead>エージェント</TableHead>
                  <TableHead>通話時間</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>結果</TableHead>
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
                    <TableCell>{conv.outcome}</TableCell>
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
