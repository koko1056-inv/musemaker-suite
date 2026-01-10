import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Clock, CheckCircle, XCircle, MessageCircle, Share2, Copy, MessageSquare, Mail, ChevronDown } from "lucide-react";
import { getAgentIcon } from "@/components/agents/AgentIconPicker";
import { format, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { ConversationDetail } from "./ConversationDetail";
import { ShareConversationDialog } from "./ShareConversationDialog";
import { useToast } from "@/hooks/use-toast";
import type { AgentConversations, ConversationDisplay } from "./types";

interface ChatViewProps {
  agent: AgentConversations;
  onBack: () => void;
  dateFilter: string;
  statusFilter: string;
  setDateFilter: (value: "all" | "today" | "week" | "month") => void;
  setStatusFilter: (value: "all" | "completed" | "failed" | "in_progress") => void;
  onMarkAsRead: (conversationId: string) => void;
}

const ChatViewComponent = ({ 
  agent,
  onBack,
  dateFilter,
  statusFilter,
  setDateFilter,
  setStatusFilter,
  onMarkAsRead,
}: ChatViewProps) => {
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

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
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

      {/* Filter Pills */}
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
                    } ${!conv.isRead && !isExpanded ? 'border-l-4 border-l-primary' : ''}`}
                  >
                    {/* Collapsed Header */}
                    <div 
                      className="flex items-center gap-3 p-3 sm:p-4"
                      onClick={() => handleSelectConversation(conv)}
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
                        {/* Share Actions */}
                        <div className="flex justify-end pt-3 mb-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                                <Share2 className="h-4 w-4" />
                                共有
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleCopyToClipboard(conv)}>
                                <Copy className="h-4 w-4 mr-2" />
                                クリップボードにコピー
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenShareDialog(conv)}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Slackに送信
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenShareDialog(conv)}>
                                <Mail className="h-4 w-4 mr-2" />
                                メールで送信
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <ConversationDetail
                          conversation={conv}
                          agentIconName={agent.iconName}
                          agentIconColor={agent.iconColor}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
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

export const ChatView = React.memo(ChatViewComponent);
