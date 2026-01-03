import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { NodeEditor } from "@/components/flow/NodeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Play,
  Upload,
  Code,
  Circle,
  Volume2,
  Loader2,
  Square,
} from "lucide-react";
import { NodeType } from "@/components/flow/FlowNode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useElevenLabs } from "@/hooks/useElevenLabs";

// Default voices with ElevenLabs IDs
const defaultVoices = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "サラ", language: "多言語", gender: "女性" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "ジョージ", language: "多言語", gender: "男性" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "マチルダ", language: "多言語", gender: "女性" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "ダニエル", language: "多言語", gender: "男性" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "リリー", language: "多言語", gender: "女性" },
];

export default function AgentEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const [agentName, setAgentName] = useState(isNew ? "" : "カスタマーサポート");
  const [selectedVoice, setSelectedVoice] = useState(defaultVoices[0].id);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: NodeType;
    title: string;
    description?: string;
  } | null>(null);
  const [previewText, setPreviewText] = useState("こんにちは！本日はどのようなご用件でしょうか？");

  const { isLoading, generateSpeech, stopAudio } = useElevenLabs();

  const embedCode = `<script src="https://voiceforge.ai/embed.js"></script>
<voice-agent id="agent_${id || 'xxx'}" />`;

  const apiEndpoint = `https://api.voiceforge.ai/v1/agents/${id || 'xxx'}/call`;

  const handlePlaySample = async () => {
    if (isLoading) {
      stopAudio();
      return;
    }
    await generateSpeech(previewText, selectedVoice);
  };

  const selectedVoiceData = defaultVoices.find(v => v.id === selectedVoice);

  return (
    <AppLayout>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/agents">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="エージェント名"
              className="w-64 border-0 bg-transparent text-lg font-semibold focus-visible:ring-0"
            />
            <Badge
              variant={status === "published" ? "default" : "secondary"}
              className="gap-1"
            >
              <Circle
                className={`h-1.5 w-1.5 ${
                  status === "published"
                    ? "fill-primary-foreground"
                    : "fill-muted-foreground"
                }`}
              />
              {status === "published" ? "公開中" : "下書き"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              テスト
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              下書き保存
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  公開
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>エージェントを公開</DialogTitle>
                  <DialogDescription>
                    このエージェントを本番環境で利用可能にします。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>埋め込みコード</Label>
                    <Textarea
                      readOnly
                      value={embedCode}
                      className="font-mono text-sm"
                      rows={3}
                    />
                    <Button variant="outline" size="sm" className="gap-2">
                      <Code className="h-4 w-4" />
                      コードをコピー
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>APIエンドポイント</Label>
                    <Input readOnly value={apiEndpoint} className="font-mono text-sm" />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setStatus("published")}
                  >
                    今すぐ公開
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Settings */}
          <div className="w-72 border-r border-border bg-card overflow-auto">
            <Tabs defaultValue="voice" className="h-full">
              <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="voice"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  音声
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  設定
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="p-4 space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>音声を選択</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col">
                            <span>{voice.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {voice.language} • {voice.gender}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="glass rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-foreground">音声プレビュー</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedVoiceData?.name}の音声でサンプルを再生
                  </p>
                  <div className="space-y-2">
                    <Textarea
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="プレビューするテキストを入力..."
                      rows={2}
                      className="text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 w-full"
                      onClick={handlePlaySample}
                      disabled={!previewText.trim()}
                    >
                      {isLoading ? (
                        <>
                          <Square className="h-4 w-4" />
                          停止
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          サンプル再生
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>話し方スタイル</Label>
                  <Select defaultValue="conversational">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">会話的</SelectItem>
                      <SelectItem value="professional">プロフェッショナル</SelectItem>
                      <SelectItem value="friendly">フレンドリー</SelectItem>
                      <SelectItem value="calm">落ち着いた</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>話す速度</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">ゆっくり</SelectItem>
                      <SelectItem value="normal">普通</SelectItem>
                      <SelectItem value="fast">速い</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="p-4 space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>エージェントの説明</Label>
                  <Textarea
                    placeholder="このエージェントの役割を説明..."
                    rows={3}
                    defaultValue="お客様のお問い合わせやサポートチケットに対応"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ウェルカムタイムアウト（秒）</Label>
                  <Input type="number" defaultValue="5" />
                </div>

                <div className="space-y-2">
                  <Label>最大通話時間（分）</Label>
                  <Input type="number" defaultValue="10" />
                </div>

                <div className="space-y-2">
                  <Label>フォールバック動作</Label>
                  <Select defaultValue="transfer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">オペレーターに転送</SelectItem>
                      <SelectItem value="retry">3回リトライ</SelectItem>
                      <SelectItem value="end">通話終了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Flow Canvas */}
          <div className="flex-1 bg-muted/30">
            <FlowCanvas onNodeSelect={setSelectedNode} />
          </div>

          {/* Right Panel - Node Editor */}
          {selectedNode && (
            <div className="w-80 border-l border-border bg-card animate-slide-in-right">
              <NodeEditor
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
