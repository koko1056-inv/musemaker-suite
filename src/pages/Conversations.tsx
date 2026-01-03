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
} from "lucide-react";

const conversations = [
  {
    id: "1",
    phone: "+81 90-1234-5678",
    agent: "カスタマーサポート",
    duration: "3:45",
    status: "completed",
    outcome: "解決済み",
    date: "2024-01-20 14:32",
    transcript: [
      { role: "agent", text: "お電話ありがとうございます。サンプル株式会社です。本日はどのようなご用件でしょうか？" },
      { role: "user", text: "注文の状況を確認したいのですが。" },
      { role: "agent", text: "かしこまりました。注文番号をお教えいただけますか？" },
      { role: "user", text: "注文番号は12345です。" },
      { role: "agent", text: "ありがとうございます。お客様のご注文は現在処理中で、2営業日以内に発送予定です。" },
      { role: "user", text: "分かりました、ありがとうございます！" },
      { role: "agent", text: "どういたしまして！他にご不明な点はございますか？" },
      { role: "user", text: "いいえ、大丈夫です。ありがとう！" },
      { role: "agent", text: "お電話ありがとうございました。良い一日をお過ごしください！" },
    ],
  },
  {
    id: "2",
    phone: "+81 80-9876-5432",
    agent: "営業アシスタント",
    duration: "5:12",
    status: "completed",
    outcome: "デモ予約済み",
    date: "2024-01-20 13:15",
    transcript: [
      { role: "agent", text: "製品にご興味をお持ちいただきありがとうございます。ご質問はございますか？" },
      { role: "user", text: "デモを予約したいのですが。" },
      { role: "agent", text: "営業チームにお繋ぎいたします。" },
    ],
  },
  {
    id: "3",
    phone: "+81 70-4567-8901",
    agent: "予約エージェント",
    duration: "2:30",
    status: "completed",
    outcome: "予約完了",
    date: "2024-01-20 11:45",
    transcript: [],
  },
  {
    id: "4",
    phone: "+81 90-3210-9876",
    agent: "カスタマーサポート",
    duration: "1:15",
    status: "failed",
    outcome: "転送済み",
    date: "2024-01-20 10:20",
    transcript: [],
  },
  {
    id: "5",
    phone: "+81 80-6543-2109",
    agent: "FAQヘルパー",
    duration: "4:00",
    status: "completed",
    outcome: "解決済み",
    date: "2024-01-20 09:55",
    transcript: [],
  },
];

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<typeof conversations[0] | null>(null);

  const filteredConversations = conversations.filter(
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
                      variant={conv.status === "completed" ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {conv.status === "completed" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {conv.status === "completed" ? "完了" : "失敗"}
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
