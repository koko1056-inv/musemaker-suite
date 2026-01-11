import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Mic, ArrowRight, Sparkles, Phone } from "lucide-react";
import musaLogo from "@/assets/musa-logo.png";
const STORAGE_KEY = "callcenter_ex_welcome_shown";

interface WelcomeDialogProps {
  onComplete?: () => void;
}

export function WelcomeDialog({ onComplete }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasShown = localStorage.getItem(STORAGE_KEY);
    if (!hasShown) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    onComplete?.();
  };

  const steps = [
    {
      title: "ようこそ！コールセンターEXへ",
      description: "プログラミング不要で、あなただけのAI音声アシスタントを作成できます。",
      features: [
        { icon: Mic, text: "自然な音声で会話" },
        { icon: MessageSquare, text: "24時間自動応答" },
        { icon: Sparkles, text: "AIが質問に回答" },
      ],
    },
    {
      title: "3ステップで完成",
      description: "たった3つのステップでAIアシスタントが作れます。",
      steps: [
        { num: 1, text: "名前と役割を決める", desc: "何をするAIか教えてください" },
        { num: 2, text: "声を選ぶ", desc: "お好みの声を試聴して選択" },
        { num: 3, text: "テスト通話", desc: "実際に話しかけてみましょう" },
      ],
    },
    {
      title: "さあ、始めましょう！",
      description: "最初のAIアシスタントを作成する準備ができました。",
      cta: true,
    },
  ];

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <div className="flex flex-col items-center text-center py-4">
          <div className="mb-6 animate-fade-in">
            <img src={musaLogo} alt="MUSA" className="h-16 w-auto" />
          </div>

          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
            <DialogDescription className="text-base">
              {currentStep.description}
            </DialogDescription>
          </DialogHeader>

          {/* Step 0: Features */}
          {step === 0 && currentStep.features && (
            <div className="grid grid-cols-3 gap-4 mt-8 w-full">
              {currentStep.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Steps */}
          {step === 1 && currentStep.steps && (
            <div className="w-full mt-6 space-y-3">
              {currentStep.steps.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 text-left animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground font-bold">{s.num}</span>
                  </div>
                  <div>
                    <p className="font-medium">{s.text}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: CTA */}
          {step === 2 && currentStep.cta && (
            <div className="w-full mt-6 animate-fade-in">
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                <img src={musaLogo} alt="MUSA" className="h-12 w-auto mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  「新しいエージェントを作成」ボタンを押して、AIアシスタントの作成を始めましょう
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between w-full mt-8">
            {/* Progress dots */}
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setStep(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === step ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <>
                  <Button variant="ghost" onClick={handleComplete}>
                    スキップ
                  </Button>
                  <Button onClick={() => setStep(step + 1)} className="gap-2">
                    次へ
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={handleComplete} className="gap-2" size="lg">
                  <Sparkles className="h-4 w-4" />
                  始める
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
