import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Phone,
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
import { VoiceCallPanel } from "@/components/voice/VoiceCallPanel";
import { useAgents } from "@/hooks/useAgents";
import { toast } from "sonner";

// Default voices with ElevenLabs IDs
const defaultVoices = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "サラ", language: "多言語", gender: "女性" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "ジョージ", language: "多言語", gender: "男性" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "マチルダ", language: "多言語", gender: "女性" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "ダニエル", language: "多言語", gender: "男性" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "リリー", language: "多言語", gender: "女性" },
];

const voiceStyles = [
  { id: "conversational", name: "会話的" },
  { id: "professional", name: "プロフェッショナル" },
  { id: "friendly", name: "フレンドリー" },
  { id: "calm", name: "落ち着いた" },
];

const voiceSpeeds = [
  { id: "slow", name: "ゆっくり" },
  { id: "normal", name: "普通" },
  { id: "fast", name: "速い" },
];

const fallbackOptions = [
  { id: "transfer", name: "オペレーターに転送" },
  { id: "retry", name: "3回リトライ" },
  { id: "end", name: "通話終了" },
];

export default function AgentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  
  const [isLoadingAgent, setIsLoadingAgent] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(defaultVoices[0].id);
  const [voiceStyle, setVoiceStyle] = useState("conversational");
  const [voiceSpeed, setVoiceSpeed] = useState("normal");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [welcomeTimeout, setWelcomeTimeout] = useState(5);
  const [maxCallDuration, setMaxCallDuration] = useState(10);
  const [fallbackBehavior, setFallbackBehavior] = useState("transfer");
  const [elevenlabsAgentId, setElevenLabsAgentId] = useState<string | null>(null);
  
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: NodeType;
    title: string;
    description?: string;
  } | null>(null);
  const [previewText, setPreviewText] = useState("こんにちは！本日はどのようなご用件でしょうか？");
  const [showCallDialog, setShowCallDialog] = useState(false);

  const { isLoading: isPlayingAudio, generateSpeech, stopAudio } = useElevenLabs();
  const { createAgent, updateAgent, getAgent } = useAgents();

  // Load existing agent
  useEffect(() => {
    if (!isNew && id) {
      setIsLoadingAgent(true);
      getAgent(id)
        .then((agent) => {
          setAgentName(agent.name);
          setDescription(agent.description || "");
          setSystemPrompt((agent as any).system_prompt || "");
          setSelectedVoice(agent.voice_id);
          setVoiceStyle(agent.voice_style || "conversational");
          setVoiceSpeed(agent.voice_speed || "normal");
          setStatus(agent.status as "draft" | "published");
          setWelcomeTimeout(agent.welcome_timeout || 5);
          setMaxCallDuration(agent.max_call_duration || 10);
          setFallbackBehavior(agent.fallback_behavior || "transfer");
          setElevenLabsAgentId(agent.elevenlabs_agent_id || null);
        })
        .catch(() => {
          navigate("/agents");
        })
        .finally(() => {
          setIsLoadingAgent(false);
        });
    }
  }, [id, isNew, getAgent, navigate]);

  const handleSave = useCallback(async (newStatus?: "draft" | "published") => {
    if (!agentName.trim()) {
      toast.error("エージェント名を入力してください");
      return;
    }

    setIsSaving(true);
    try {
      const agentData = {
        name: agentName,
        description: description || null,
        system_prompt: systemPrompt || null,
        voice_id: selectedVoice,
        voice_style: voiceStyle,
        voice_speed: voiceSpeed,
        status: newStatus || status,
        welcome_timeout: welcomeTimeout,
        max_call_duration: maxCallDuration,
        fallback_behavior: fallbackBehavior,
      };

      if (isNew) {
        const newAgent = await createAgent(agentData as any);
        setElevenLabsAgentId(newAgent.elevenlabs_agent_id || null);
        navigate(`/agents/${newAgent.id}`, { replace: true });
      } else if (id) {
        const updatedAgent = await updateAgent(id, agentData as any);
        if (newStatus) setStatus(newStatus);
        setElevenLabsAgentId(updatedAgent.elevenlabs_agent_id || null);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    agentName, description, systemPrompt, selectedVoice, voiceStyle, voiceSpeed, 
    status, welcomeTimeout, maxCallDuration, fallbackBehavior,
    isNew, id, createAgent, updateAgent, navigate
  ]);

  const handlePublish = async () => {
    await handleSave("published");
  };

  const handlePlaySample = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }
    await generateSpeech(previewText, selectedVoice);
  };

  const selectedVoiceData = defaultVoices.find(v => v.id === selectedVoice);

  const embedCode = `<script src="https://voiceforge.ai/embed.js"></script>
<voice-agent id="agent_${id || 'xxx'}" />`;

  const apiEndpoint = `https://api.voiceforge.ai/v1/agents/${id || 'xxx'}/call`;

  if (isLoadingAgent) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

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
            <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" />
                  通話テスト
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>音声通話テスト</DialogTitle>
                  <DialogDescription>
                    {elevenlabsAgentId 
                      ? 'ElevenLabsと同期済みのエージェントで通話をテストできます'
                      : 'エージェントを保存してElevenLabsと同期してから通話をテストしてください'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {elevenlabsAgentId ? (
                    <>
                      <div className="space-y-2">
                        <Label>ElevenLabs Agent ID</Label>
                        <Input
                          value={elevenlabsAgentId}
                          readOnly
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          このエージェントはElevenLabsと同期されています
                        </p>
                      </div>
                      <VoiceCallPanel
                        agentId={id || 'test'}
                        elevenLabsAgentId={elevenlabsAgentId}
                        agentName={agentName || 'テストエージェント'}
                        onCallEnd={() => {
                          // Optionally close dialog or refresh data
                        }}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      エージェントを保存するとElevenLabsに自動的に同期され、通話テストが可能になります。
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" disabled={isSaving}>
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
                    onClick={handlePublish}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
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
                      {isPlayingAudio ? (
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
                  <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>話す速度</Label>
                  <Select value={voiceSpeed} onValueChange={setVoiceSpeed}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceSpeeds.map((speed) => (
                        <SelectItem key={speed.id} value={speed.id}>
                          {speed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="p-4 space-y-4 mt-0">
                {elevenlabsAgentId && (
                  <div className="glass rounded-lg p-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">ElevenLabs Agent ID</Label>
                    <p className="text-sm font-mono break-all">{elevenlabsAgentId}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>エージェントの説明</Label>
                  <Textarea
                    placeholder="このエージェントの役割を説明..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>システムプロンプト</Label>
                  <Textarea
                    placeholder="エージェントの振る舞いを定義するプロンプトを入力..."
                    rows={4}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    空の場合、エージェント名と説明から自動生成されます
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>ウェルカムタイムアウト（秒）</Label>
                  <Input 
                    type="number" 
                    value={welcomeTimeout}
                    onChange={(e) => setWelcomeTimeout(parseInt(e.target.value) || 5)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>最大通話時間（分）</Label>
                  <Input 
                    type="number" 
                    value={maxCallDuration}
                    onChange={(e) => setMaxCallDuration(parseInt(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>フォールバック動作</Label>
                  <Select value={fallbackBehavior} onValueChange={setFallbackBehavior}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fallbackOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
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
