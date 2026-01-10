import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Bot, 
  Phone, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Zap,
  ArrowRight,
  Sparkles,
  Globe,
  FileText,
  Bell,
  ExternalLink,
  CheckCircle2,
  Play,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Import preview images
import dashboardPreview from "@/assets/guide-dashboard-preview.png";
import agentConfigPreview from "@/assets/guide-agent-config.png";
import callHistoryPreview from "@/assets/guide-call-history.png";

const steps = [
  {
    number: 1,
    title: "エージェントを作成",
    description: "AIエージェントの名前、説明、音声を設定して作成します",
    icon: Bot,
    link: "/agents/new",
    linkText: "作成へ",
    image: agentConfigPreview,
  },
  {
    number: 2,
    title: "ナレッジベースを登録",
    description: "よくある質問や商品情報などをナレッジベースに登録します",
    icon: BookOpen,
    link: "/knowledge",
    linkText: "登録へ",
  },
  {
    number: 3,
    title: "プロンプトを設定",
    description: "エージェントの応答スタイルや対応方針をプロンプトで指示します",
    icon: FileText,
    link: "/agents",
    linkText: "一覧へ",
  },
  {
    number: 4,
    title: "電話番号を接続",
    description: "Twilioの電話番号を接続して着信を受け付けられるようにします",
    icon: Phone,
    link: "/phone-numbers",
    linkText: "接続へ",
  },
  {
    number: 5,
    title: "公開して運用開始",
    description: "エージェントを公開して実際の通話対応を開始します",
    icon: Zap,
    link: "/agents",
    linkText: "公開へ",
  },
];

const features = [
  {
    title: "受信通話対応",
    description: "着信した電話にAIエージェントが自動で応答します",
    icon: Phone,
    color: "from-green-500/20 to-green-600/10",
    iconColor: "text-green-500",
  },
  {
    title: "発信通話",
    description: "指定した電話番号にAIエージェントから発信できます",
    icon: MessageSquare,
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500",
  },
  {
    title: "ナレッジベース",
    description: "FAQ・商品情報などをアップロードしてAIが参照できます",
    icon: BookOpen,
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-500",
  },
  {
    title: "抽出変数",
    description: "通話から顧客名・電話番号などを自動で抽出します",
    icon: Sparkles,
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-500",
  },
  {
    title: "Webhook連携",
    description: "通話終了時などにWebhookでデータを送信します",
    icon: Globe,
    color: "from-cyan-500/20 to-cyan-600/10",
    iconColor: "text-cyan-500",
  },
  {
    title: "Slack/メール通知",
    description: "通話結果をSlackやメールで通知します",
    icon: Bell,
    color: "from-pink-500/20 to-pink-600/10",
    iconColor: "text-pink-500",
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 sm:pb-6">
        {/* Hero Header */}
        <div className="mb-8 sm:mb-12">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  使い方ガイド
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  MUSAでAI電話エージェントを構築・運用するための完全ガイドです。
                  はじめての方もこのガイドで簡単にスタートできます。
                </p>
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto shrink-0">
                <Link to="/agents/new">
                  <Play className="h-4 w-4 mr-2" />
                  今すぐ始める
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Images Section */}
        <section className="mb-10 sm:mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { image: dashboardPreview, label: "ダッシュボード", to: "/" },
              { image: agentConfigPreview, label: "エージェント設定", to: "/agents/new" },
              { image: callHistoryPreview, label: "通話履歴", to: "/conversations" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.label}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Getting Started Steps */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">はじめかた</h2>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden sm:block" />
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <Card key={step.number} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4 p-4 sm:p-5">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg">
                      {step.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <step.icon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Link to={step.link} className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm">{step.linkText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">主な機能</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-4 sm:p-5 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">よくある質問</h2>
          </div>
          
          <Card className="overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="border-b border-border last:border-0"
                >
                  <AccordionTrigger className="text-left text-sm py-4 px-4 sm:px-5 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
                    <span className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground px-4 sm:px-5 pb-4 pl-11">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* Quick Links */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">クイックリンク</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: "/agents/new", icon: Bot, label: "エージェント作成", color: "from-violet-500/20 to-violet-600/10", iconColor: "text-violet-500" },
              { to: "/knowledge", icon: BookOpen, label: "ナレッジ管理", color: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-500" },
              { to: "/settings", icon: Settings, label: "設定", color: "from-slate-500/20 to-slate-600/10", iconColor: "text-slate-500" },
              { to: "/conversations", icon: MessageSquare, label: "通話履歴", color: "from-orange-500/20 to-orange-600/10", iconColor: "text-orange-500" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300 text-center"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <link.icon className={`h-5 w-5 ${link.iconColor}`} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
