import React, { useCallback, useMemo, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Clock, CheckCircle, XCircle, Share2, Copy, MessageSquare, Mail, ChevronDown, User } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { ConversationDetail } from "./ConversationDetail";
import { ShareConversationDialog } from "./ShareConversationDialog";
import { useToast } from "@/hooks/use-toast";
import type { AgentConversations, ConversationDisplay } from "./types";

interface ConversationHistoryTableProps {
  agent: AgentConversations;
  onBack: () => void;
  dateFilter: string;
  statusFilter: string;
  setDateFilter: (value: "all" | "today" | "week" | "month") => void;
  setStatusFilter: (value: "all" | "completed" | "failed" | "in_progress") => void;
  onMarkAsRead: (conversationId: string) => void;
}

const ConversationHistoryTableComponent = ({
  agent,
  onBack,
  dateFilter,
  statusFilter,
  setDateFilter,
  setStatusFilter,
  onMarkAsRead,
}: ConversationHistoryTableProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareConversation, setShareConversation] = useState<ConversationDisplay | null>(null);
  const { toast } = useToast();
  const IconComponent = getAgentIcon(agent.iconName);

  const generateShareText = useCallback((conv: ConversationDisplay) => {
    const callDate = format(conv.rawDate, 'yyyy年M月d日 HH:mm', { locale: ja });
    
    let text = `📞 受電記録\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    text += `エージェント: ${agent.agentName}\n`;
    text += `発信者: ${conv.phone}\n`;
    text += `日時: ${callDate}\n`;
    text += `通話時間: ${conv.duration}\n`;
    text += `━━━━━━━━━━━━━━━\n\n`;
    
    if (conv.summary) {
      text += `📝 要約\n${conv.summary}\n\n`;
    }
    
    if (conv.keyPoints && conv.keyPoints.length > 0) {
      text += `💡 重要ポイント\n`;
      conv.keyPoints.forEach((point, i) => {
        text += `  ${i + 1}. ${point}\n`;
      });
      text += '\n';
    }
    
    if (conv.transcript && conv.transcript.length > 0) {
      text += `💬 会話ログ\n`;
      conv.transcript.forEach(msg => {
        const role = msg.role === 'agent' ? '🤖 AI' : '👤 お客様';
        text += `${role}: ${msg.text}\n`;
      });
    }
    
    return text;
  }, [agent.agentName]);

  const handleCopyToClipboard = useCallback(async (conv: ConversationDisplay) => {
    const text = generateShareText(conv);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `受電記録 - ${agent.agentName}`,
          text: text,
        });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({
        title: "コピーしました",
        description: "会話内容をクリップボードにコピーしました",
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  }, [generateShareText, agent.agentName, toast]);

  const handleOpenShareDialog = useCallback((conv: ConversationDisplay) => {
    setShareConversation(conv);
    setShareDialogOpen(true);
  }, []);

  const handleSelectConversation = useCallback((conv: ConversationDisplay) => {
    setSelectedConversationId(prevId => {
      const newId = prevId === conv.id ? null : conv.id;
      if (newId && !conv.isRead) {
        onMarkAsRead(conv.id);
      }
      return newId;
    });
  }, [onMarkAsRead]);

  const filteredConversations = useMemo(() => {
    return agent.conversations.filter((conv) => {
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
  }, [agent.conversations, dateFilter, statusFilter]);

  const getStatusBadge = (status: string, isMobile: boolean = false) => {
    if (isMobile) {
      // Mobile: icon only
      switch (status) {
        case "completed":
          return (
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
          );
        case "in_progress":
          return (
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
          );
        case "failed":
          return (
            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          );
        default:
          return null;
      }
    }
    // Desktop: full badge
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 gap-1.5 px-3 py-1">
            <CheckCircle className="h-3.5 w-3.5" />
            完了
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 gap-1.5 px-3 py-1">
            <Clock className="h-3.5 w-3.5" />
            通話中
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 gap-1.5 px-3 py-1">
            <XCircle className="h-3.5 w-3.5" />
            失敗
          </Badge>
        );
      default:
        return null;
    }
  };

  const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 bg-background border-b border-border sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{agent.agentName}</h1>
          <p className="text-xs text-muted-foreground">通話履歴</p>
        </div>

        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm shrink-0"
          style={{ backgroundColor: agent.iconColor }}
        >
          <IconComponent className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="border-b border-border bg-muted/30">
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 sm:gap-2 p-3 sm:p-4">
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
                className={`text-xs h-8 px-4 rounded-full whitespace-nowrap ${
                  dateFilter === option.value 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {option.label}
              </Button>
            ))}
            <div className="w-px bg-border mx-1" />
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`text-xs h-8 px-4 rounded-full whitespace-nowrap ${
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

      {/* Table Content */}
      <ScrollArea className="flex-1">
        {selectedConversation ? (
          /* Expanded Detail View */
          <div className="flex flex-col">
            <button
              onClick={() => setSelectedConversationId(null)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-accent/50 transition-colors border-b border-border"
            >
              <ChevronDown className="h-4 w-4" />
              <span>一覧に戻る</span>
            </button>

            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{selectedConversation.phone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(selectedConversation.rawDate, 'M月d日 HH:mm', { locale: ja })} · {selectedConversation.duration}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      共有
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleCopyToClipboard(selectedConversation)}>
                      <Copy className="h-4 w-4 mr-2" />
                      クリップボードにコピー
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenShareDialog(selectedConversation)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Slackに送信
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenShareDialog(selectedConversation)}>
                      <Mail className="h-4 w-4 mr-2" />
                      メールで送信
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-4 pb-24">
              <ConversationDetail
                conversation={selectedConversation}
                agentIconName={agent.iconName}
                agentIconColor={agent.iconColor}
              />
            </div>
          </div>
        ) : (
          /* Mobile-optimized Card List + Desktop Table */
          <>
            {/* Mobile View - Card List */}
            <div className="sm:hidden">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">該当する会話がありません</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredConversations.map((conv, index) => {
                    const showDateSeparator = index === 0 || 
                      format(conv.rawDate, 'yyyy-MM-dd') !== format(filteredConversations[index - 1].rawDate, 'yyyy-MM-dd');

                    return (
                      <React.Fragment key={conv.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center py-3 bg-muted/20">
                            <span className="text-[11px] text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full">
                              {isToday(conv.rawDate) ? '今日' : 
                               isYesterday(conv.rawDate) ? '昨日' : 
                               format(conv.rawDate, 'M月d日（E）', { locale: ja })}
                            </span>
                          </div>
                        )}
                        <div 
                          className={`flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors ${
                            !conv.isRead ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleSelectConversation(conv)}
                        >
                          {/* Status Indicator */}
                          <div className="shrink-0 w-2">
                            <div className={`h-2 w-2 rounded-full ${
                              conv.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 
                              !conv.isRead ? 'bg-primary' : 'bg-transparent'
                            }`} />
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-11 w-11 border-2 border-background shadow-sm shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-foreground truncate text-sm">
                                {conv.phone !== '不明' ? conv.phone : '不明な発信者'}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {format(conv.rawDate, 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {conv.summary || conv.transcript?.[0]?.text || `通話時間: ${conv.duration}`}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {getStatusBadge(conv.status, true)}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-8 text-muted-foreground font-normal text-xs"></TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs">発信者</TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs">概要</TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs">時間</TableHead>
                    <TableHead className="text-muted-foreground font-normal text-xs text-right">ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        該当する会話がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConversations.map((conv, index) => {
                      const showDateSeparator = index === 0 || 
                        format(conv.rawDate, 'yyyy-MM-dd') !== format(filteredConversations[index - 1].rawDate, 'yyyy-MM-dd');

                      return (
                        <React.Fragment key={conv.id}>
                          {showDateSeparator && (
                            <TableRow className="hover:bg-transparent border-0">
                              <TableCell colSpan={5} className="py-3 px-0">
                                <div className="flex items-center gap-3">
                                  <div className="h-px flex-1 bg-border/50" />
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    {isToday(conv.rawDate) ? '今日' : 
                                     isYesterday(conv.rawDate) ? '昨日' : 
                                     format(conv.rawDate, 'M月d日（E）', { locale: ja })}
                                  </span>
                                  <div className="h-px flex-1 bg-border/50" />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow 
                            className={`cursor-pointer transition-colors border-border/30 ${
                              !conv.isRead ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => handleSelectConversation(conv)}
                          >
                            {/* Active Indicator */}
                            <TableCell className="w-8 pr-0">
                              <div className={`h-2 w-2 rounded-full ${
                                conv.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 
                                !conv.isRead ? 'bg-primary' : 'bg-transparent'
                              }`} />
                            </TableCell>

                            {/* Caller Info */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm">
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate text-sm">
                                    {conv.phone !== '不明' ? conv.phone : '不明な発信者'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {agent.agentName}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Summary */}
                            <TableCell className="max-w-[200px]">
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.summary || conv.transcript?.[0]?.text || '-'}
                              </p>
                            </TableCell>

                            {/* Duration/Time */}
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium text-foreground">{conv.duration}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(conv.rawDate, 'HH:mm')}
                                </p>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-right">
                              {getStatusBadge(conv.status)}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Share Dialog */}
      {shareConversation && (
        <ShareConversationDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          conversationId={shareConversation.id}
          phoneNumber={shareConversation.phone}
        />
      )}
    </div>
  );
};

export const ConversationHistoryTable = React.memo(ConversationHistoryTableComponent);
