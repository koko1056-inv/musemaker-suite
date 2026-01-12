import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
  Calendar,
  ClipboardList,
  MessageCircle,
  Clock,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// 業界定義
const INDUSTRIES = [
  { id: "clinic", label: "病院・クリニック", icon: "🏥" },
  { id: "dental", label: "歯科医院", icon: "🦷" },
  { id: "beauty", label: "美容サロン", icon: "💅" },
  { id: "restaurant", label: "飲食店", icon: "🍽️" },
  { id: "hotel", label: "ホテル・旅館", icon: "🏨" },
  { id: "realestate", label: "不動産", icon: "🏠" },
  { id: "retail", label: "小売・EC", icon: "🛒" },
  { id: "fitness", label: "フィットネス・ジム", icon: "💪" },
  { id: "education", label: "教育・スクール", icon: "📚" },
  { id: "repair", label: "修理・メンテナンス", icon: "🔧" },
  { id: "consulting", label: "コンサルティング", icon: "💼" },
  { id: "other", label: "その他", icon: "📋" },
];

// 用途定義
const USE_CASES = [
  {
    id: "new_reservation",
    label: "新規予約を受け付けたい",
    icon: Calendar,
    description: "新規のお客様からの予約を自動で受付",
    extractFields: ["名前", "連絡先", "希望日時", "メニュー/サービス"],
  },
  {
    id: "change_reservation",
    label: "予約の変更を受け付けたい",
    icon: ClipboardList,
    description: "既存予約の変更・キャンセル対応",
    extractFields: ["名前", "現在の予約日時", "新しい希望日時"],
  },
  {
    id: "cancel_reservation",
    label: "予約のキャンセルを受け付けたい",
    icon: ClipboardList,
    description: "キャンセルの受付と確認",
    extractFields: ["名前", "予約日時", "キャンセル理由"],
  },
  {
    id: "redirect_web",
    label: "予約対応をHP/フォームへ誘導したい",
    icon: MessageCircle,
    description: "ウェブサイトやフォームへの案内",
    extractFields: [],
  },
  {
    id: "hours_inquiry",
    label: "診療時間/営業時間のお問い合わせに自動で回答したい",
    icon: Clock,
    description: "営業時間・休業日の案内",
    extractFields: [],
  },
  {
    id: "route_info",
    label: "道案内を自動で対応したい",
    icon: HelpCircle,
    description: "店舗・施設への道順案内",
    extractFields: [],
  },
  {
    id: "general_inquiry",
    label: "一般的な問い合わせに対応したい",
    icon: MessageCircle,
    description: "よくある質問への自動回答",
    extractFields: ["質問内容"],
  },
];

// 生成されるルールの型
interface GeneratedRule {
  id: string;
  title: string;
  description: string;
  isAiGenerated: boolean;
}

interface EasySetupWizardProps {
  onComplete: (config: {
    name: string;
    description: string;
    systemPrompt: string;
    firstMessage: string;
    extractionFields: string[];
  }) => void;
  onBack: () => void;
}

export function EasySetupWizard({ onComplete, onBack }: EasySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<GeneratedRule[]>([]);
  const [generatedConfig, setGeneratedConfig] = useState<{
    systemPrompt: string;
    firstMessage: string;
    name: string;
    description: string;
  } | null>(null);

  const selectedIndustryData = INDUSTRIES.find((i) => i.id === selectedIndustry);
  const selectedUseCaseData = selectedUseCases
    .map((id) => USE_CASES.find((u) => u.id === id))
    .filter(Boolean);

  // 用途が変更されたらルールを更新
  useEffect(() => {
    if (selectedUseCases.length > 0) {
      const rules: GeneratedRule[] = [];

      // はじめの案内（常に追加）
      rules.push({
        id: "greeting",
        title: "はじめの案内",
        description: "AIが音声を認識して対応いたします。\nご用件をお申し付けください。",
        isAiGenerated: false,
      });

      // 選択された用途に応じたルール
      selectedUseCases.forEach((useCaseId) => {
        const useCase = USE_CASES.find((u) => u.id === useCaseId);
        if (!useCase) return;

        switch (useCaseId) {
          case "new_reservation":
            rules.push({
              id: "new_reservation",
              title: "新規予約の受付",
              description: `AIがお客様に以下の項目を質問します。\n「1. 名前 / 2. 連絡先 / 3. 希望日時 / 4. メニュー/サービス」`,
              isAiGenerated: true,
            });
            break;
          case "change_reservation":
            rules.push({
              id: "change_reservation",
              title: "予約変更の受付",
              description: `AIがお客様に以下の項目を質問します。\n「1. 名前 / 2. 現在の予約日時 / 3. 新しい希望日時 / 4. 電話番号」`,
              isAiGenerated: true,
            });
            break;
          case "cancel_reservation":
            rules.push({
              id: "cancel_reservation",
              title: "キャンセル受付",
              description: `AIがお客様に以下の項目を質問します。\n「1. 名前 / 2. 予約日時 / 3. キャンセル理由」`,
              isAiGenerated: true,
            });
            break;
          case "hours_inquiry":
            rules.push({
              id: "hours_inquiry",
              title: "営業時間の確認",
              description: `音声で以下の案内をします。\n「営業時間は平日●●:●●から●●:●●まで」`,
              isAiGenerated: false,
            });
            break;
          case "redirect_web":
            rules.push({
              id: "redirect_web",
              title: "ウェブサイトへの誘導",
              description: `ウェブサイトでの予約・お問い合わせを案内します。`,
              isAiGenerated: false,
            });
            break;
          case "route_info":
            rules.push({
              id: "route_info",
              title: "アクセス案内",
              description: `店舗・施設への道順を音声で案内します。`,
              isAiGenerated: false,
            });
            break;
          case "general_inquiry":
            rules.push({
              id: "general_inquiry",
              title: "一般問い合わせ対応",
              description: `よくある質問に自動で回答します。`,
              isAiGenerated: true,
            });
            break;
        }
      });

      setGeneratedRules(rules);
    } else {
      setGeneratedRules([]);
    }
  }, [selectedUseCases]);

  const handleUseCaseToggle = (useCaseId: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(useCaseId)
        ? prev.filter((id) => id !== useCaseId)
        : [...prev, useCaseId]
    );
  };

  const canProceed = selectedIndustry && selectedUseCases.length > 0;

  const handleGenerateConfig = async () => {
    if (!selectedIndustry || selectedUseCases.length === 0) return;

    setIsGenerating(true);
    try {
      const industryLabel = INDUSTRIES.find((i) => i.id === selectedIndustry)?.label || "";
      const useCaseLabels = selectedUseCases
        .map((id) => USE_CASES.find((u) => u.id === id)?.label)
        .filter(Boolean)
        .join("、");

      const description = `${industryLabel}の電話対応AIです。主な対応内容: ${useCaseLabels}`;

      const { data, error } = await supabase.functions.invoke("generate-agent-prompt", {
        body: {
          agentName: `${industryLabel}アシスタント`,
          description,
          language: "ja",
          industry: selectedIndustry,
          useCases: selectedUseCases,
        },
      });

      if (error) throw error;

      const config = {
        name: `${industryLabel}アシスタント`,
        description,
        systemPrompt: data?.prompt || "",
        firstMessage:
          "お電話ありがとうございます。ご用件をお伺いいたします。",
      };

      setGeneratedConfig(config);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error generating config:", error);
      toast.error("設定の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!generatedConfig) return;

    // 抽出フィールドを収集
    const extractionFields: string[] = [];
    selectedUseCases.forEach((useCaseId) => {
      const useCase = USE_CASES.find((u) => u.id === useCaseId);
      if (useCase?.extractFields) {
        extractionFields.push(...useCase.extractFields);
      }
    });

    // 重複を除去
    const uniqueFields = [...new Set(extractionFields)];

    onComplete({
      ...generatedConfig,
      extractionFields: uniqueFields,
    });
  };

  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">かんたんセットアップ</h2>
          <p className="text-sm text-muted-foreground">
            いくつかの質問に答えるだけで、最適な設定を生成します
          </p>
        </div>
      </div>

      {/* Step 1: Industry & Use Cases Selection */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Questions */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                業界/業種
              </h3>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="h-11 bg-popover">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      <span className="flex items-center gap-2">
                        <span>{industry.icon}</span>
                        <span>{industry.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                主な利用用途
              </h3>
              <p className="text-xs text-muted-foreground mb-4">複数選択可能</p>

              <div className="space-y-3">
                {USE_CASES.map((useCase) => {
                  const isSelected = selectedUseCases.includes(useCase.id);
                  const Icon = useCase.icon;

                  return (
                    <label
                      key={useCase.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{useCase.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {useCase.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-4">
            <Card className="p-5 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">提案されたルール設定</h3>
                {generatedRules.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {generatedRules.length}件
                  </Badge>
                )}
              </div>

              {generatedRules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">左側で用途を選択すると</p>
                  <p className="text-sm">ルール設定がプレビューされます</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-3">
                    {generatedRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 rounded-lg bg-background border"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm">{rule.title}</h4>
                          {rule.isAiGenerated && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-primary/5 text-primary border-primary/20"
                            >
                              AI対話
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">
                          {rule.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Generate Button */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleGenerateConfig}
                  disabled={!canProceed || isGenerating}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  保存して確認
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ※ ルール設定は後から編集可能です
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {currentStep === 2 && generatedConfig && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">設定が完成しました！</h3>
                <p className="text-sm text-muted-foreground">
                  以下の内容でエージェントを作成します
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">エージェント名</Label>
                <p className="font-medium mt-1">{generatedConfig.name}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">役割・説明</Label>
                <p className="text-sm mt-1">{generatedConfig.description}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">対応ルール</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatedRules.map((rule) => (
                    <Badge key={rule.id} variant="secondary" className="text-xs">
                      {rule.title}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">最初の発話</Label>
                <p className="text-sm mt-1 italic">"{generatedConfig.firstMessage}"</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻って編集
            </Button>
            <Button onClick={handleComplete} className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              この設定で作成
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
