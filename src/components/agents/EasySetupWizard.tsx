import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  MapPin,
  Info,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// 業界定義
const INDUSTRIES = [
  { id: "clinic", label: "病院・クリニック", icon: "🏥", hoursLabel: "診療時間", closedLabel: "休診日" },
  { id: "dental", label: "歯科医院", icon: "🦷", hoursLabel: "診療時間", closedLabel: "休診日" },
  { id: "beauty", label: "美容サロン", icon: "💅", hoursLabel: "営業時間", closedLabel: "定休日" },
  { id: "restaurant", label: "飲食店", icon: "🍽️", hoursLabel: "営業時間", closedLabel: "定休日" },
  { id: "hotel", label: "ホテル・旅館", icon: "🏨", hoursLabel: "チェックイン/アウト", closedLabel: "休業日" },
  { id: "realestate", label: "不動産", icon: "🏠", hoursLabel: "営業時間", closedLabel: "定休日" },
  { id: "retail", label: "小売・EC", icon: "🛒", hoursLabel: "営業時間", closedLabel: "定休日" },
  { id: "fitness", label: "フィットネス・ジム", icon: "💪", hoursLabel: "営業時間", closedLabel: "定休日" },
  { id: "education", label: "教育・スクール", icon: "📚", hoursLabel: "受付時間", closedLabel: "休校日" },
  { id: "repair", label: "修理・メンテナンス", icon: "🔧", hoursLabel: "受付時間", closedLabel: "定休日" },
  { id: "consulting", label: "コンサルティング", icon: "💼", hoursLabel: "営業時間", closedLabel: "定休日" },
  { id: "other", label: "その他", icon: "📋", hoursLabel: "営業時間", closedLabel: "定休日" },
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
    icon: MapPin,
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

// 曜日
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日", "祝"];

// 生成されるルールの型
interface GeneratedRule {
  id: string;
  title: string;
  description: string;
  isAiGenerated: boolean;
}

// 店舗情報の型
interface BusinessInfo {
  name: string;
  address: string;
  nearestStation: string;
  weekdayHours: string;
  weekendHours: string;
  closedDays: string[];
  specialNotes: string;
  services: string;
  websiteUrl: string;
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

  // 店舗情報
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    address: "",
    nearestStation: "",
    weekdayHours: "9:00〜18:00",
    weekendHours: "9:00〜17:00",
    closedDays: [],
    specialNotes: "",
    services: "",
    websiteUrl: "",
  });

  const selectedIndustryData = INDUSTRIES.find((i) => i.id === selectedIndustry);

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
              title: `${selectedIndustryData?.hoursLabel || "営業時間"}の確認`,
              description: businessInfo.weekdayHours 
                ? `音声で以下の案内をします。\n「${selectedIndustryData?.hoursLabel || "営業時間"}は平日${businessInfo.weekdayHours}${businessInfo.weekendHours ? `、土日祝${businessInfo.weekendHours}` : ""}です。${businessInfo.closedDays.length > 0 ? `${selectedIndustryData?.closedLabel || "定休日"}は${businessInfo.closedDays.join("・")}です。` : ""}」`
                : `音声で${selectedIndustryData?.hoursLabel || "営業時間"}を案内します。`,
              isAiGenerated: false,
            });
            break;
          case "redirect_web":
            rules.push({
              id: "redirect_web",
              title: "ウェブサイトへの誘導",
              description: businessInfo.websiteUrl
                ? `「ご予約・お問い合わせはウェブサイト${businessInfo.websiteUrl}からお願いいたします」と案内します。`
                : `ウェブサイトでの予約・お問い合わせを案内します。`,
              isAiGenerated: false,
            });
            break;
          case "route_info":
            rules.push({
              id: "route_info",
              title: "アクセス案内",
              description: businessInfo.address || businessInfo.nearestStation
                ? `「${businessInfo.nearestStation ? `最寄り駅は${businessInfo.nearestStation}です。` : ""}${businessInfo.address ? `所在地は${businessInfo.address}です。` : ""}」と案内します。`
                : `店舗・施設への道順を音声で案内します。`,
              isAiGenerated: false,
            });
            break;
          case "general_inquiry":
            rules.push({
              id: "general_inquiry",
              title: "一般問い合わせ対応",
              description: businessInfo.services
                ? `「${businessInfo.services}」などのサービスについてご案内します。`
                : `よくある質問に自動で回答します。`,
              isAiGenerated: true,
            });
            break;
        }
      });

      setGeneratedRules(rules);
    } else {
      setGeneratedRules([]);
    }
  }, [selectedUseCases, businessInfo, selectedIndustryData]);

  const handleUseCaseToggle = (useCaseId: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(useCaseId)
        ? prev.filter((id) => id !== useCaseId)
        : [...prev, useCaseId]
    );
  };

  const handleClosedDayToggle = (day: string) => {
    setBusinessInfo((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter((d) => d !== day)
        : [...prev.closedDays, day],
    }));
  };

  const canProceedStep1 = selectedIndustry && selectedUseCases.length > 0;
  const canProceedStep2 = businessInfo.name.trim().length > 0;

  const handleGenerateConfig = async () => {
    if (!selectedIndustry || selectedUseCases.length === 0) return;

    setIsGenerating(true);
    try {
      const industryLabel = INDUSTRIES.find((i) => i.id === selectedIndustry)?.label || "";
      const useCaseLabels = selectedUseCases
        .map((id) => USE_CASES.find((u) => u.id === id)?.label)
        .filter(Boolean)
        .join("、");

      // 店舗情報を含めた詳細な説明を生成
      let detailedDescription = `${businessInfo.name || industryLabel}の電話対応AIです。`;
      detailedDescription += `\n\n【対応内容】\n${useCaseLabels}`;
      
      if (businessInfo.weekdayHours) {
        detailedDescription += `\n\n【${selectedIndustryData?.hoursLabel || "営業時間"}】\n平日: ${businessInfo.weekdayHours}`;
        if (businessInfo.weekendHours) {
          detailedDescription += `\n土日祝: ${businessInfo.weekendHours}`;
        }
      }
      
      if (businessInfo.closedDays.length > 0) {
        detailedDescription += `\n${selectedIndustryData?.closedLabel || "定休日"}: ${businessInfo.closedDays.join("・")}`;
      }

      if (businessInfo.address) {
        detailedDescription += `\n\n【所在地】\n${businessInfo.address}`;
      }

      if (businessInfo.nearestStation) {
        detailedDescription += `\n最寄り駅: ${businessInfo.nearestStation}`;
      }

      if (businessInfo.services) {
        detailedDescription += `\n\n【サービス内容】\n${businessInfo.services}`;
      }

      if (businessInfo.specialNotes) {
        detailedDescription += `\n\n【特記事項】\n${businessInfo.specialNotes}`;
      }

      const { data, error } = await supabase.functions.invoke("generate-agent-prompt", {
        body: {
          agentName: businessInfo.name || `${industryLabel}アシスタント`,
          description: detailedDescription,
          language: "ja",
          industry: selectedIndustry,
          useCases: selectedUseCases,
          businessInfo,
        },
      });

      if (error) throw error;

      const config = {
        name: businessInfo.name || `${industryLabel}アシスタント`,
        description: detailedDescription,
        systemPrompt: data?.prompt || "",
        firstMessage: `お電話ありがとうございます。${businessInfo.name || industryLabel}でございます。ご用件をお伺いいたします。`,
      };

      setGeneratedConfig(config);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error generating config:", error);
      toast.error("設定の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!generatedConfig) return;

    const extractionFields: string[] = [];
    selectedUseCases.forEach((useCaseId) => {
      const useCase = USE_CASES.find((u) => u.id === useCaseId);
      if (useCase?.extractFields) {
        extractionFields.push(...useCase.extractFields);
      }
    });

    const uniqueFields = [...new Set(extractionFields)];

    onComplete({
      ...generatedConfig,
      extractionFields: uniqueFields,
    });
  };

  // Step indicator
  const steps = [
    { num: 1, label: "業種・用途" },
    { num: 2, label: "店舗情報" },
    { num: 3, label: "確認" },
  ];

  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">かんたんセットアップ</h2>
          <p className="text-sm text-muted-foreground">
            いくつかの質問に答えるだけで、最適な設定を生成します
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-center gap-2 mb-6 py-3 border-y">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center gap-2">
            <button
              onClick={() => step.num < currentStep && setCurrentStep(step.num)}
              disabled={step.num > currentStep}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                currentStep === step.num
                  ? "bg-primary text-primary-foreground font-medium"
                  : step.num < currentStep
                  ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
                {step.num < currentStep ? "✓" : step.num}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${step.num < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
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

              <div className="space-y-3 max-h-[350px] overflow-auto pr-1">
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
                <ScrollArea className="h-[350px] pr-2">
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

              {/* Next Button */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full gap-2"
                  size="lg"
                >
                  次へ：店舗情報を入力
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Business Information */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Forms */}
          <div className="space-y-5">
            {/* Basic Info */}
            <Card className="p-5">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                基本情報
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    店舗・施設名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={`例：${selectedIndustryData?.icon} 〇〇${selectedIndustryData?.label?.replace(/・.*/, "") || "店舗"}`}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="services">提供サービス</Label>
                  <Textarea
                    id="services"
                    value={businessInfo.services}
                    onChange={(e) => setBusinessInfo((prev) => ({ ...prev, services: e.target.value }))}
                    placeholder="例：一般診療、健康診断、予防接種など"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Hours */}
            <Card className="p-5">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {selectedIndustryData?.hoursLabel || "営業時間"}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="weekdayHours">平日</Label>
                    <Input
                      id="weekdayHours"
                      value={businessInfo.weekdayHours}
                      onChange={(e) => setBusinessInfo((prev) => ({ ...prev, weekdayHours: e.target.value }))}
                      placeholder="9:00〜18:00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekendHours">土日祝</Label>
                    <Input
                      id="weekendHours"
                      value={businessInfo.weekendHours}
                      onChange={(e) => setBusinessInfo((prev) => ({ ...prev, weekendHours: e.target.value }))}
                      placeholder="9:00〜17:00"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{selectedIndustryData?.closedLabel || "定休日"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = businessInfo.closedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleClosedDayToggle(day)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            isSelected
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : "bg-muted border-transparent hover:border-border"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Location */}
            <Card className="p-5">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                アクセス情報
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">住所</Label>
                  <Input
                    id="address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="例：東京都渋谷区〇〇1-2-3"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nearestStation">最寄り駅</Label>
                  <Input
                    id="nearestStation"
                    value={businessInfo.nearestStation}
                    onChange={(e) => setBusinessInfo((prev) => ({ ...prev, nearestStation: e.target.value }))}
                    placeholder="例：渋谷駅徒歩5分"
                    className="h-10"
                  />
                </div>
              </div>
            </Card>

            {/* Additional Info */}
            <Card className="p-5">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                その他
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">ウェブサイトURL</Label>
                  <Input
                    id="websiteUrl"
                    value={businessInfo.websiteUrl}
                    onChange={(e) => setBusinessInfo((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://example.com"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialNotes">特記事項・補足</Label>
                  <Textarea
                    id="specialNotes"
                    value={businessInfo.specialNotes}
                    onChange={(e) => setBusinessInfo((prev) => ({ ...prev, specialNotes: e.target.value }))}
                    placeholder="例：駐車場あり、クレジットカード利用可など"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-4">
            <Card className="p-5 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">提案されたルール設定</h3>
                <Badge variant="secondary" className="text-xs">
                  {generatedRules.length}件
                </Badge>
              </div>

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

              {/* Generate Button */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <Button
                  onClick={handleGenerateConfig}
                  disabled={!canProceedStep2 || isGenerating}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  設定を生成
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && generatedConfig && (
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
                <Label className="text-xs text-muted-foreground">最初の発話</Label>
                <p className="text-sm mt-1 italic">"{generatedConfig.firstMessage}"</p>
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

              {businessInfo.weekdayHours && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-xs text-muted-foreground">{selectedIndustryData?.hoursLabel || "営業時間"}</Label>
                  <p className="text-sm mt-1">
                    平日: {businessInfo.weekdayHours}
                    {businessInfo.weekendHours && ` / 土日祝: ${businessInfo.weekendHours}`}
                  </p>
                  {businessInfo.closedDays.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedIndustryData?.closedLabel || "定休日"}: {businessInfo.closedDays.join("・")}
                    </p>
                  )}
                </div>
              )}

              {(businessInfo.address || businessInfo.nearestStation) && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-xs text-muted-foreground">アクセス</Label>
                  {businessInfo.address && <p className="text-sm mt-1">{businessInfo.address}</p>}
                  {businessInfo.nearestStation && <p className="text-sm text-muted-foreground">{businessInfo.nearestStation}</p>}
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
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
