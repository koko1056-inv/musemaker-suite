import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Play,
  Upload,
  Circle,
  Volume2,
  Loader2,
  Square,
  Phone,
  RefreshCw,
  Mic,
  MessageSquare,
  Settings2,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  
  const [isLoadingAgent, setIsLoadingAgent] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [maxCallDuration, setMaxCallDuration] = useState(10);
  const [elevenlabsAgentId, setElevenLabsAgentId] = useState<string | null>(null);
  
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  const { isLoading: isPlayingAudio, fetchVoices, generateSpeech, stopAudio } = useElevenLabs();
  const { createAgent, updateAgent, getAgent } = useAgents();

  // Fetch ElevenLabs voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const fetchedVoices = await fetchVoices();
        if (fetchedVoices && fetchedVoices.length > 0) {
          setAvailableVoices(fetchedVoices);
          if (!selectedVoice && fetchedVoices.length > 0) {
            setSelectedVoice(fetchedVoices[0].id);
          }
        }
      } finally {
        setIsLoadingVoices(false);
      }
    };
    loadVoices();
  }, [fetchVoices]);

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
          setVoiceSpeed(parseFloat(agent.voice_speed || "1.0"));
          setStatus(agent.status as "draft" | "published");
          setMaxCallDuration(agent.max_call_duration || 10);
          setElevenLabsAgentId(agent.elevenlabs_agent_id || null);
          setCurrentStep(3); // Go to final step for existing agents
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

    if (!selectedVoice) {
      toast.error("音声を選択してください");
      return;
    }

    setIsSaving(true);
    try {
      const agentData = {
        name: agentName,
        description: description || null,
        system_prompt: systemPrompt || null,
        voice_id: selectedVoice,
        voice_style: "conversational",
        voice_speed: voiceSpeed.toString(),
        status: newStatus || status,
        welcome_timeout: 5,
        max_call_duration: maxCallDuration,
        fallback_behavior: "end",
      };

      if (isNew) {
        const newAgent = await createAgent(agentData as any);
        setElevenLabsAgentId(newAgent.elevenlabs_agent_id || null);
        toast.success("エージェントを作成しました！");
        navigate(`/agents/${newAgent.id}`, { replace: true });
      } else if (id) {
        const updatedAgent = await updateAgent(id, agentData as any);
        if (newStatus) setStatus(newStatus);
        setElevenLabsAgentId(updatedAgent.elevenlabs_agent_id || null);
        toast.success("保存しました");
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    agentName, description, systemPrompt, selectedVoice, voiceSpeed,
    status, maxCallDuration, isNew, id, createAgent, updateAgent, navigate
  ]);

  const handleVoicePreview = (e: React.MouseEvent, voice: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    
    if (playingPreviewId === voice.id) {
      setPlayingPreviewId(null);
      setPreviewAudio(null);
      return;
    }
    
    if (voice.preview_url) {
      const audio = new Audio(voice.preview_url);
      setPreviewAudio(audio);
      setPlayingPreviewId(voice.id);
      
      audio.onended = () => {
        setPlayingPreviewId(null);
        setPreviewAudio(null);
      };
      
      audio.onerror = () => {
        setPlayingPreviewId(null);
        setPreviewAudio(null);
        toast.error("プレビューの再生に失敗しました");
      };
      
      audio.play().catch(() => {
        setPlayingPreviewId(null);
        setPreviewAudio(null);
      });
    }
  };

  const selectedVoiceData = availableVoices.find(v => v.id === selectedVoice);
  
  const canProceedToStep2 = agentName.trim().length > 0;
  const canProceedToStep3 = canProceedToStep2 && selectedVoice;

  if (isLoadingAgent) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="flex h-screen flex-col bg-muted/30">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/agents">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-semibold">
                  {isNew ? "新しいエージェントを作成" : agentName || "エージェント編集"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isNew ? "AIアシスタントを簡単に設定できます" : "エージェントの設定を編集"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isNew && (
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
              )}
              
              {elevenlabsAgentId && (
                <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Phone className="h-4 w-4" />
                      テスト通話
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>テスト通話</DialogTitle>
                      <DialogDescription>
                        作成したエージェントと会話してみましょう
                      </DialogDescription>
                    </DialogHeader>
                    <VoiceCallPanel
                      agentId={id || 'test'}
                      elevenLabsAgentId={elevenlabsAgentId}
                      agentName={agentName || 'テストエージェント'}
                      onCallEnd={() => {}}
                    />
                  </DialogContent>
                </Dialog>
              )}
              
              <Button 
                onClick={() => handleSave()}
                disabled={isSaving || !canProceedToStep3}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isNew ? "作成" : "保存"}
              </Button>
            </div>
          </header>

          {/* Progress Steps */}
          {isNew && (
            <div className="bg-background border-b border-border px-6 py-3">
              <div className="flex items-center justify-center gap-8 max-w-2xl mx-auto">
                {[
                  { num: 1, label: "基本情報", icon: MessageSquare },
                  { num: 2, label: "音声設定", icon: Mic },
                  { num: 3, label: "確認", icon: CheckCircle2 },
                ].map((step, idx) => (
                  <div key={step.num} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (step.num === 1) setCurrentStep(1);
                        else if (step.num === 2 && canProceedToStep2) setCurrentStep(2);
                        else if (step.num === 3 && canProceedToStep3) setCurrentStep(3);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                        currentStep === step.num
                          ? "bg-primary text-primary-foreground"
                          : currentStep > step.num
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{step.label}</span>
                    </button>
                    {idx < 2 && (
                      <div className={`w-12 h-0.5 ${currentStep > step.num ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-auto py-8">
            <div className="max-w-2xl mx-auto px-6 space-y-6">
              
              {/* Step 1: Basic Info */}
              {(currentStep === 1 || !isNew) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      基本情報
                    </CardTitle>
                    <CardDescription>
                      エージェントの名前と役割を設定します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        エージェント名
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="例: カスタマーサポート担当"
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        お客様に表示される名前です
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="flex items-center gap-2">
                        役割・説明
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">エージェントがどんな役割を果たすか説明してください。これがAIの振る舞いに影響します。</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="例: お客様からの問い合わせに丁寧に対応し、製品の質問や注文状況の確認をサポートします"
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prompt" className="flex items-center gap-2">
                        詳細な指示（オプション）
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">より詳細な振る舞いを指定したい場合に入力してください。空欄の場合は役割・説明から自動生成されます。</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Textarea
                        id="prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="より詳しい指示を入力（省略可）"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Voice Settings */}
              {(currentStep === 2 || !isNew) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      音声設定
                    </CardTitle>
                    <CardDescription>
                      エージェントの声を選びます
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          音声を選択
                          <span className="text-destructive">*</span>
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setIsLoadingVoices(true);
                            const fetchedVoices = await fetchVoices();
                            if (fetchedVoices && fetchedVoices.length > 0) {
                              setAvailableVoices(fetchedVoices);
                            }
                            setIsLoadingVoices(false);
                          }}
                          disabled={isLoadingVoices}
                          className="h-8 px-2 text-xs gap-1"
                        >
                          {isLoadingVoices ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          更新
                        </Button>
                      </div>

                      {isLoadingVoices ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-auto p-1">
                          {availableVoices.slice(0, 20).map((voice) => (
                            <button
                              key={voice.id}
                              onClick={() => setSelectedVoice(voice.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                selectedVoice === voice.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 flex-shrink-0 rounded-full"
                                onClick={(e) => handleVoicePreview(e, voice)}
                              >
                                {playingPreviewId === voice.id ? (
                                  <Square className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{voice.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {voice.labels?.gender === "female" ? "女性" : voice.labels?.gender === "male" ? "男性" : ""} 
                                  {voice.labels?.accent ? ` • ${voice.labels.accent}` : ""}
                                </p>
                              </div>
                              {selectedVoice === voice.id && (
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {availableVoices.length > 20 && (
                        <p className="text-xs text-muted-foreground text-center">
                          上位20件を表示中（全{availableVoices.length}件）
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        話す速度
                        <span className="text-sm font-normal text-muted-foreground">
                          {voiceSpeed.toFixed(1)}x
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">ゆっくり</span>
                        <Slider
                          value={[voiceSpeed]}
                          onValueChange={([val]) => setVoiceSpeed(val)}
                          min={0.7}
                          max={1.3}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">速い</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        最大通話時間
                        <span className="text-sm font-normal text-muted-foreground">
                          {maxCallDuration}分
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">1分</span>
                        <Slider
                          value={[maxCallDuration]}
                          onValueChange={([val]) => setMaxCallDuration(val)}
                          min={1}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">30分</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && isNew && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      確認
                    </CardTitle>
                    <CardDescription>
                      設定内容を確認してエージェントを作成します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">エージェント名</span>
                        <span className="font-medium">{agentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">音声</span>
                        <span className="font-medium">{selectedVoiceData?.name || "未選択"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">話す速度</span>
                        <span className="font-medium">{voiceSpeed.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最大通話時間</span>
                        <span className="font-medium">{maxCallDuration}分</span>
                      </div>
                      {description && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground text-sm">役割・説明</span>
                          <p className="mt-1 text-sm">{description}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      エージェントを作成
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              {isNew && (
                <div className="flex justify-between pt-4">
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      戻る
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {currentStep < 3 && (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={
                        (currentStep === 1 && !canProceedToStep2) ||
                        (currentStep === 2 && !canProceedToStep3)
                      }
                    >
                      次へ
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
