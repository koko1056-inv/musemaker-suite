import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Bot, 
  Phone, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Mic,
  Globe,
  FileText,
  Users,
  Bell,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  {
    number: 1,
    title: "エージェントを作成",
    description: "AIエージェントの名前、説明、音声を設定して作成します",
    icon: Bot,
    link: "/agents/new",
    linkText: "エージェント作成へ",
  },
  {
    number: 2,
    title: "ナレッジベースを登録",
    description: "よくある質問や商品情報などをナレッジベースに登録します",
    icon: BookOpen,
    link: "/knowledge",
    linkText: "ナレッジ管理へ",
  },
  {
    number: 3,
    title: "プロンプトを設定",
    description: "エージェントの応答スタイルや対応方針をプロンプトで指示します",
    icon: FileText,
    link: "/agents",
    linkText: "エージェント一覧へ",
  },
  {
    number: 4,
    title: "電話番号を接続",
    description: "Twilioの電話番号を接続して着信を受け付けられるようにします",
    icon: Phone,
    link: "/phone-numbers",
    linkText: "電話番号管理へ",
  },
  {
    number: 5,
    title: "公開して運用開始",
    description: "エージェントを公開して実際の通話対応を開始します",
    icon: Zap,
    link: "/agents",
    linkText: "エージェント一覧へ",
  },
];

const features = [
  {
    title: "受信通話対応",
    description: "着信した電話にAIエージェントが自動で応答します",
    icon: Phone,
    badge: "基本機能",
  },
  {
    title: "発信通話",
    description: "指定した電話番号にAIエージェントから発信できます",
    icon: MessageSquare,
    badge: "発信機能",
  },
  {
    title: "ナレッジベース",
    description: "FAQ・商品情報などをアップロードしてAIが参照できます",
    icon: BookOpen,
    badge: "知識管理",
  },
  {
    title: "抽出変数",
    description: "通話から顧客名・電話番号などを自動で抽出します",
    icon: Sparkles,
    badge: "AI抽出",
  },
  {
    title: "Webhook連携",
    description: "通話終了時などにWebhookでデータを送信します",
    icon: Globe,
    badge: "連携",
  },
  {
    title: "Slack/メール通知",
    description: "通話結果をSlackやメールで通知します",
    icon: Bell,
    badge: "通知",
  },
];

const faqs = [
  {
    question: "ElevenLabsのAPIキーはどこで取得できますか？",
    answer: "ElevenLabsの公式サイト (elevenlabs.io) にログインし、Profile → API Keysから取得できます。取得したAPIキーは設定ページのAPI連携タブで登録してください。",
  },
  {
    question: "TwilioのアカウントSIDと認証トークンはどこで確認できますか？",
    answer: "Twilioコンソール (console.twilio.com) にログインすると、ダッシュボードにAccount SIDとAuth Tokenが表示されています。これらを設定ページで登録してください。",
  },
  {
    question: "エージェントを公開するにはどうすればいいですか？",
    answer: "エージェント編集画面で必要な設定を完了した後、右上の「公開」ボタンをクリックすると公開状態になります。電話番号とエージェントを紐づけると着信対応が開始されます。",
  },
  {
    question: "ナレッジベースとエージェントの紐づけ方法は？",
    answer: "エージェント編集画面の「ナレッジベース」セクションで、作成済みのナレッジベースを選択して紐づけることができます。複数のナレッジベースを1つのエージェントに紐づけることも可能です。",
  },
  {
    question: "通話履歴はどこで確認できますか？",
    answer: "サイドバーの「通話履歴」からすべての着信通話を、「発信コール」から発信通話を確認できます。各通話の詳細では録音・文字起こし・要約を確認できます。",
  },
  {
    question: "抽出変数の使い方を教えてください",
    answer: "エージェント編集画面の「抽出変数」セクションで変数を定義します。例えば「customer_name」という変数を作成すると、通話中にAIが顧客名を自動で抽出して保存します。抽出されたデータはWebhookで送信したり通話詳細で確認できます。",
  },
];

export default function Guide() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 sm:pb-6">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">使い方ガイド</h1>
              <p className="text-sm text-muted-foreground">
                MUSAの基本的な使い方と機能を説明します
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started Steps */}
        <section className="mb-12">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            はじめかた
          </h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <Card key={step.number} className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link to={step.link} className="flex items-center gap-1">
                      <span className="hidden sm:inline">{step.linkText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            主な機能
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-foreground">{feature.title}</h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {feature.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            よくある質問
          </h2>
          <Card>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="px-4">
                  <AccordionTrigger className="text-left text-sm py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            クイックリンク
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: "/agents/new", icon: Bot, label: "エージェント作成" },
              { to: "/knowledge", icon: BookOpen, label: "ナレッジ管理" },
              { to: "/settings", icon: Settings, label: "設定" },
              { to: "/conversations", icon: MessageSquare, label: "通話履歴" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center"
              >
                <link.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
