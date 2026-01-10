import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Wand2, FileText } from "lucide-react";

export function MobileEmptyState() {
  return (
    <div className="lg:hidden">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border mb-6">
          <Bot className="h-10 w-10 text-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          AIエージェントを作成
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          電話対応を自動化するAIアシスタントを作成しましょう
        </p>
      </div>

      {/* Quick Create Options */}
      <div className="space-y-3">
        <Link
          to="/agents/new?method=ai"
          className="flex items-center gap-4 p-4 rounded-2xl bg-foreground text-background active:opacity-90 transition-opacity touch-target"
        >
          <div className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center">
            <Wand2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-base">AIで自動作成</p>
            <p className="text-sm opacity-70">説明するだけで完成</p>
          </div>
        </Link>

        <Link
          to="/agents/new?method=template"
          className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card active:bg-muted/50 transition-colors touch-target"
        >
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-base">テンプレートから</p>
            <p className="text-sm text-muted-foreground">業種別テンプレート</p>
          </div>
        </Link>

        <Link
          to="/agents/new?method=scratch"
          className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card active:bg-muted/50 transition-colors touch-target"
        >
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-base">ゼロから作成</p>
            <p className="text-sm text-muted-foreground">完全カスタマイズ</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
