import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Bot,
  MoreVertical,
  Circle,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const agents = [
  {
    id: "1",
    name: "カスタマーサポート",
    description: "お客様のお問い合わせやサポートチケットに対応",
    status: "published",
    voice: "レイチェル",
    conversations: 1234,
    successRate: 94,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "営業アシスタント",
    description: "リード獲得とデモのスケジュール調整",
    status: "draft",
    voice: "ジョシュ",
    conversations: 0,
    successRate: 0,
    createdAt: "2024-01-18",
  },
  {
    id: "3",
    name: "予約エージェント",
    description: "予約と予約管理を担当",
    status: "published",
    voice: "サラ",
    conversations: 567,
    successRate: 89,
    createdAt: "2024-01-10",
  },
  {
    id: "4",
    name: "FAQヘルパー",
    description: "よくある質問に回答",
    status: "published",
    voice: "アダム",
    conversations: 890,
    successRate: 97,
    createdAt: "2024-01-08",
  },
  {
    id: "5",
    name: "オンボーディングガイド",
    description: "新規ユーザーの利用開始をサポート",
    status: "draft",
    voice: "エミリー",
    conversations: 0,
    successRate: 0,
    createdAt: "2024-01-20",
  },
];

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">エージェント</h1>
            <p className="mt-1 text-muted-foreground">
              音声AIエージェントを作成・管理
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/agents/new">
              <Plus className="h-4 w-4" />
              エージェント作成
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="エージェントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent, index) => (
            <div
              key={agent.id}
              className="glass rounded-xl card-shadow transition-all duration-200 hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={agent.status === "published" ? "default" : "secondary"}
                      className="gap-1"
                    >
                      <Circle
                        className={`h-1.5 w-1.5 ${
                          agent.status === "published"
                            ? "fill-primary-foreground"
                            : "fill-muted-foreground"
                        }`}
                      />
                      {agent.status === "published" ? "公開中" : "下書き"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            編集
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          複製
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          埋め込みコード取得
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <Link to={`/agents/${agent.id}`}>
                  <h3 className="mb-1 font-semibold text-foreground hover:text-primary transition-colors">
                    {agent.name}
                  </h3>
                </Link>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">音声: </span>
                      <span className="font-medium text-foreground">{agent.voice}</span>
                    </div>
                  </div>
                </div>

                {agent.status === "published" && (
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {agent.conversations.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">会話数</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {agent.successRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">成功率</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Create New Card */}
          <Link
            to="/agents/new"
            className="glass rounded-xl card-shadow border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 animate-fade-in flex items-center justify-center min-h-[240px]"
            style={{ animationDelay: `${filteredAgents.length * 50}ms` }}
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <p className="font-medium text-foreground">新規エージェント作成</p>
              <p className="text-sm text-muted-foreground">数分で音声AIを構築</p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
