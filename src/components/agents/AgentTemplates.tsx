import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  HelpCircle,
  Phone,
  ShoppingCart,
  Headphones,
  Building2,
  Sparkles,
  ArrowRight,
  Clock,
  MessageSquare,
  UserCheck,
  ClipboardList,
} from "lucide-react";

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultValues: {
    name: string;
    description: string;
    systemPrompt: string;
    maxCallDuration: number;
    voiceSpeed: number;
  };
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: "scheduling",
    name: "日程調整アシスタント",
    description: "予約やアポイントメントの日程調整を自動で行います。空き時間の確認、予約の受付、リスケジュールに対応。",
    category: "予約・スケジュール",
    icon: Calendar,
    color: "bg-blue-500/10 text-blue-600",
    defaultValues: {
      name: "日程調整アシスタント",
      description: "お客様の予約・日程調整をサポートするAIアシスタントです。空き状況の確認や予約の変更にも対応します。",
      systemPrompt: `あなたは親切で効率的な日程調整アシスタントです。

【役割】
- お客様からの予約や日程調整のリクエストに対応する
- 空き時間の確認と最適な日時の提案
- 予約の確認、変更、キャンセルの受付

【対応方針】
- 明るく親しみやすい口調で対応する
- 日時は「○月○日（曜日）○時」の形式で分かりやすく伝える
- 複数の候補日がある場合は選択肢を提示する
- 予約内容は必ず復唱して確認する

【確認事項】
- お名前
- ご連絡先（電話番号またはメール）
- ご希望の日時（第1希望〜第3希望）
- ご用件の簡単な説明

【注意点】
- 個人情報は適切に取り扱う
- 不明点があれば丁寧に確認する
- 担当者への引き継ぎが必要な場合は適切に案内する`,
      maxCallDuration: 10,
      voiceSpeed: 1.0,
    },
  },
  {
    id: "first-response",
    name: "一次応答オペレーター",
    description: "電話の一次受付を担当。用件の確認、担当への振り分け、折り返し連絡の案内を行います。",
    category: "受付・案内",
    icon: Phone,
    color: "bg-green-500/10 text-green-600",
    defaultValues: {
      name: "一次応答オペレーター",
      description: "電話の一次応対を行い、お客様の用件を確認して適切な担当者へ取り次ぎます。",
      systemPrompt: `あなたは丁寧で頼りになる一次応答オペレーターです。

【役割】
- お客様からの電話を最初に受け、用件を確認する
- 適切な担当部署・担当者への取り次ぎを案内する
- 担当者不在時は折り返し連絡の手配をする

【対応方針】
- 落ち着いた丁寧な口調で対応する
- お客様の話をしっかり聞き、用件を正確に把握する
- 対応できない内容は無理に回答せず、担当者への取り次ぎを案内する

【必ず確認する事項】
- お名前（会社名がある場合は会社名も）
- お電話番号
- ご用件の概要
- 折り返し希望の有無と希望時間帯

【対応パターン】
- 既存のお客様 → 担当者への取り次ぎを案内
- 新規のお問い合わせ → 用件を確認し適切な部署を案内
- クレーム → 丁重にお詫びし、担当者から折り返しを約束
- 営業電話 → 丁寧にお断りするか、担当部署を案内`,
      maxCallDuration: 5,
      voiceSpeed: 1.0,
    },
  },
  {
    id: "simple-guide",
    name: "簡易案内ガイド",
    description: "営業時間、場所、基本的なサービス内容など、よくある質問に自動で回答します。",
    category: "FAQ・案内",
    icon: HelpCircle,
    color: "bg-purple-500/10 text-purple-600",
    defaultValues: {
      name: "案内ガイド",
      description: "営業時間や場所、サービス内容など基本的なお問い合わせに対応するAIアシスタントです。",
      systemPrompt: `あなたは明るく親切な案内ガイドです。

【役割】
- 営業時間、所在地、アクセス方法などの基本情報を案内する
- サービス内容や料金に関する一般的な質問に回答する
- よくある質問（FAQ）に対応する

【対応方針】
- 明るくはきはきとした口調で対応する
- 分かりやすい言葉で簡潔に説明する
- 質問が不明確な場合は確認してから回答する

【案内できる情報例】
- 営業時間：平日9:00〜18:00、土日祝休み
- 所在地・アクセス方法
- 基本的なサービス内容と料金目安
- 予約方法や申込み方法
- ウェブサイトやお問い合わせ先の案内

【注意点】
- 個別の案件や詳細な相談は担当者への取り次ぎを案内する
- 分からない質問には「担当者に確認します」と案内する
- 最新の情報はウェブサイトの確認を促す`,
      maxCallDuration: 5,
      voiceSpeed: 1.0,
    },
  },
  {
    id: "customer-support",
    name: "カスタマーサポート",
    description: "製品やサービスに関するお問い合わせ、トラブルシューティング、使い方の説明に対応します。",
    category: "サポート",
    icon: Headphones,
    color: "bg-orange-500/10 text-orange-600",
    defaultValues: {
      name: "カスタマーサポート",
      description: "製品やサービスに関するお問い合わせに対応し、お客様の問題解決をサポートします。",
      systemPrompt: `あなたは経験豊富で親身なカスタマーサポート担当です。

【役割】
- 製品・サービスに関する質問への回答
- トラブルシューティングのサポート
- 使い方や設定方法の説明
- 問題が解決しない場合のエスカレーション

【対応方針】
- お客様の状況に共感し、寄り添った対応をする
- 専門用語を避け、分かりやすく説明する
- 一つずつ順序立てて問題解決を進める
- 解決したら最後に確認する

【対応の流れ】
1. お困りの内容を詳しくお聞きする
2. 状況を整理し、原因を特定する
3. 解決策を提案し、一緒に試してみる
4. 解決を確認し、他にご質問がないか確認する

【エスカレーション基準】
- 技術的に高度な問題
- アカウントや請求に関する問題
- クレームや不満が強いケース
→ 「専門の担当者にお繋ぎします」と案内`,
      maxCallDuration: 15,
      voiceSpeed: 1.0,
    },
  },
  {
    id: "order-inquiry",
    name: "注文確認アシスタント",
    description: "注文状況の確認、配送状況の案内、注文内容の変更やキャンセル対応を行います。",
    category: "EC・注文",
    icon: ShoppingCart,
    color: "bg-pink-500/10 text-pink-600",
    defaultValues: {
      name: "注文確認アシスタント",
      description: "ご注文の状況確認、配送案内、変更・キャンセルのお手続きをサポートします。",
      systemPrompt: `あなたは丁寧で正確な注文確認アシスタントです。

【役割】
- 注文状況・配送状況の確認と案内
- 注文内容の変更・キャンセル受付
- 返品・交換の案内
- 在庫確認と入荷予定の案内

【対応方針】
- 正確な情報提供を心がける
- 注文番号などは復唱して確認する
- お客様の不安を解消する丁寧な説明
- 対応できない要求は正直に伝え、代替案を提示

【確認事項】
- ご注文番号（分からない場合はお名前・電話番号で検索）
- お問い合わせ内容（状況確認/変更/キャンセル/その他）

【ステータス説明】
- 注文受付：ご注文を承りました
- 出荷準備中：商品を準備しています
- 発送済み：配送業者に引き渡しました
- 配達完了：お届けが完了しました

【注意点】
- 発送後の変更・キャンセルは受付不可
- 返品・交換は到着後7日以内`,
      maxCallDuration: 10,
      voiceSpeed: 1.0,
    },
  },
  {
    id: "facility-guide",
    name: "施設案内コンシェルジュ",
    description: "施設内の案内、設備の説明、イベント情報の提供など、来訪者へのおもてなしを担当。",
    category: "施設・イベント",
    icon: Building2,
    color: "bg-cyan-500/10 text-cyan-600",
    defaultValues: {
      name: "施設案内コンシェルジュ",
      description: "施設のご案内、設備の説明、イベント情報のご提供など、来訪者の皆様をおもてなしします。",
      systemPrompt: `あなたは洗練されたおもてなしを提供する施設案内コンシェルジュです。

【役割】
- 施設内の各エリア・設備のご案内
- イベント・展示情報の提供
- お食事・休憩スポットのご案内
- 交通アクセス・駐車場情報の案内

【対応方針】
- 上品で丁寧な言葉遣い
- お客様のニーズを先回りした提案
- 分かりやすい説明と具体的な道順案内
- 困っているお客様への積極的なサポート

【案内できる情報】
- 各フロアの案内（テナント、施設、サービス）
- 営業時間・定休日
- イベントスケジュール
- バリアフリー情報
- 駐車場・駐輪場情報
- 最寄り駅からのアクセス

【おもてなしのポイント】
- お子様連れ → キッズスペースやおむつ替えスポットを案内
- ご高齢者 → エレベーターや休憩スペースを優先的に案内
- 外国人ゲスト → 簡潔で分かりやすい説明を心がける`,
      maxCallDuration: 10,
      voiceSpeed: 0.9,
    },
  },
];

interface AgentTemplatesProps {
  onSelectTemplate: (template: AgentTemplate) => void;
  onSkip: () => void;
}

export function AgentTemplates({ onSelectTemplate, onSkip }: AgentTemplatesProps) {
  const categories = [...new Set(agentTemplates.map(t => t.category))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          テンプレートから始める
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          よくあるユースケースから選んで、すぐにエージェントを作成できます。
          もちろん後から自由にカスタマイズ可能です。
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {agentTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
            onClick={() => onSelectTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${template.color}`}>
                  <template.icon className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.defaultValues.maxCallDuration}分
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    設定済み
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skip Option */}
      <div className="text-center pt-4 border-t">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ClipboardList className="h-4 w-4" />
          テンプレートを使わず、白紙から作成する
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
