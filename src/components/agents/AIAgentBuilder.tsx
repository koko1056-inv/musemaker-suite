import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  User,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AgentTemplate } from "./AgentTemplates";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAgentBuilderProps {
  onConfigReady: (template: AgentTemplate) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-agent-config`;

export function AIAgentBuilder({ onConfigReady }: AIAgentBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "こんにちは！音声AIエージェントの作成をお手伝いします。\n\nまず、どのような業種やビジネスでAIを活用したいですか？\n例：クリニック、不動産会社、飲食店、ECサイトなど",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [configReady, setConfigReady] = useState<AgentTemplate["defaultValues"] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseConfigFromResponse = (content: string): AgentTemplate["defaultValues"] | null => {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.ready && parsed.config) {
          return parsed.config;
        }
      } catch (e) {
        console.error("Failed to parse config JSON:", e);
      }
    }
    return null;
  };

  const cleanResponseContent = (content: string): string => {
    // Remove JSON blocks from displayed content
    return content.replace(/```json[\s\S]*?```/g, "").trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("リクエスト制限に達しました。しばらく待ってから再度お試しください。");
        } else if (resp.status === 402) {
          toast.error("AIクレジットが不足しています。");
        } else {
          toast.error("エラーが発生しました。");
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages([...newMessages, { role: "assistant", content: cleanResponseContent(assistantContent) }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check if config is ready
      const config = parseConfigFromResponse(assistantContent);
      if (config) {
        setConfigReady(config);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("エラーが発生しました。");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleUseConfig = () => {
    if (!configReady) return;

    const template: AgentTemplate = {
      id: "ai-generated",
      name: configReady.name,
      description: configReady.description,
      category: "AIで生成",
      categoryType: "scene",
      icon: Sparkles,
      color: "bg-primary/10 text-primary",
      defaultValues: configReady,
    };

    onConfigReady(template);
  };

  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 p-5 border-b">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AIアシスタント</h3>
            <p className="text-sm text-muted-foreground">
              対話を通じて最適なエージェント設定を提案します
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-80" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/70 border border-border/50"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-muted/70 border border-border/50 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {configReady && (
        <div className="p-5 border-t bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <span className="font-bold text-green-700 dark:text-green-400">
              設定が完成しました！
            </span>
          </div>
          <div className="bg-background rounded-xl p-4 mb-4 border-2 border-green-500/20">
            <p className="font-semibold text-base">{configReady.name}</p>
            <p className="text-muted-foreground text-sm mt-1">{configReady.description}</p>
          </div>
          <Button onClick={handleUseConfig} className="w-full gap-2 h-12 rounded-xl shadow-md shadow-primary/20">
            <Sparkles className="h-5 w-5" />
            この設定でエージェントを作成
          </Button>
        </div>
      )}

      <div className="p-4 border-t bg-muted/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={isLoading}
            className="flex-1 h-11"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="h-11 w-11 rounded-xl" size="icon">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
