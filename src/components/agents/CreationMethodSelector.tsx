import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  LayoutTemplate,
  Settings2,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface CreationMethodSelectorProps {
  onSelectMethod: (method: "easy" | "ai" | "template" | "manual") => void;
}

export function CreationMethodSelector({ onSelectMethod }: CreationMethodSelectorProps) {
  const methods = [
    {
      id: "easy" as const,
      title: "かんたんセットアップ",
      subtitle: "おすすめ",
      description: "いくつかの質問に答えるだけで、業界に最適な設定を自動生成",
      icon: Zap,
      iconBg: "bg-yellow-500/10 text-yellow-600",
      features: ["業界選択", "用途チェック", "自動設定生成"],
      recommended: true,
    },
    {
      id: "ai" as const,
      title: "AIアシストで作成",
      subtitle: "対話形式",
      description: "AIとの会話を通じて、要件を整理しながら設定を構築",
      icon: Sparkles,
      iconBg: "bg-purple-500/10 text-purple-500",
      features: ["対話形式", "詳細なカスタマイズ", "AI提案"],
      recommended: false,
    },
    {
      id: "template" as const,
      title: "テンプレートから選ぶ",
      subtitle: "すぐ使える",
      description: "用意されたテンプレートから選んで、すぐに開始",
      icon: LayoutTemplate,
      iconBg: "bg-blue-500/10 text-blue-500",
      features: ["豊富なテンプレート", "業種別", "すぐ使える"],
      recommended: false,
    },
    {
      id: "manual" as const,
      title: "手動で設定",
      subtitle: "上級者向け",
      description: "すべての設定を自分でカスタマイズ",
      icon: Settings2,
      iconBg: "bg-gray-500/10 text-gray-500",
      features: ["完全カスタマイズ", "詳細設定", "経験者向け"],
      recommended: false,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">作成方法を選択</h2>
        <p className="text-muted-foreground mt-2">
          最適な方法でAIエージェントを作成しましょう
        </p>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <Card
              key={method.id}
              className={`p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                method.recommended ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => onSelectMethod(method.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${method.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{method.title}</h3>
                    {method.recommended && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        {method.subtitle}
                      </span>
                    )}
                    {!method.recommended && (
                      <span className="text-xs text-muted-foreground">
                        {method.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {method.description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {method.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 mt-1">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        💡 どの方法でも、後から設定を編集できます
      </p>
    </div>
  );
}
