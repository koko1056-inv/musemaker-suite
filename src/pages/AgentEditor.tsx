import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Play,
  Circle,
  Loader2,
  Square,
  Phone,
  RefreshCw,
  Mic,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  PartyPopper,
  ArrowRight,
  LayoutTemplate,
  Bot,
  Volume2,
  Folder,
  Globe,
  FileEdit,
} from "lucide-react";
import { AgentTemplates, AgentTemplate } from "@/components/agents/AgentTemplates";
import { AgentIconPicker } from "@/components/agents/AgentIconPicker";
import { AgentKnowledgeSection } from "@/components/agents/AgentKnowledgeSection";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useElevenLabs } from "@/hooks/useElevenLabs";
import { VoiceCallPanel } from "@/components/voice/VoiceCallPanel";
import { useAgents } from "@/hooks/useAgents";
import { useAgentFolders } from "@/hooks/useAgentFolders";
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
  const [searchParams] = useSearchParams();
  const isNew = id === "new";
  const creationMethod = searchParams.get("method"); // "template", "scratch", or "ai"
  
  // If method is "scratch", skip template selection
  const shouldShowTemplates = isNew && creationMethod !== "scratch" && creationMethod !== "ai";
  
  const [isLoadingAgent, setIsLoadingAgent] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(shouldShowTemplates);
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
  const [iconName, setIconName] = useState("bot");
  const [iconColor, setIconColor] = useState("#10b981");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // VAD settings
  const [vadThreshold, setVadThreshold] = useState(0.5);
  const [vadSilenceDuration, setVadSilenceDuration] = useState(500);
  const [vadPrefixPadding, setVadPrefixPadding] = useState(300);
  
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [newlyCreatedAgentId, setNewlyCreatedAgentId] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  const { isLoading: isPlayingAudio, fetchVoices, generateSpeech, stopAudio } = useElevenLabs();
  const { createAgent, updateAgent, getAgent } = useAgents();
  const { folders } = useAgentFolders();

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
          setIconName((agent as any).icon_name || "bot");
          setIconColor((agent as any).icon_color || "#10b981");
          setSelectedFolderId(agent.folder_id || null);
          // VAD settings
          setVadThreshold((agent as any).vad_threshold ?? 0.5);
          setVadSilenceDuration((agent as any).vad_silence_duration_ms ?? 500);
          setVadPrefixPadding((agent as any).vad_prefix_padding_ms ?? 300);
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
        icon_name: iconName,
        icon_color: iconColor,
        folder_id: selectedFolderId,
        // VAD settings
        vad_mode: "server_vad",
        vad_threshold: vadThreshold,
        vad_silence_duration_ms: vadSilenceDuration,
        vad_prefix_padding_ms: vadPrefixPadding,
      };

      if (isNew) {
        const newAgent = await createAgent(agentData as any);
        setElevenLabsAgentId(newAgent.elevenlabs_agent_id || null);
        setNewlyCreatedAgentId(newAgent.id);
        // Show onboarding dialog instead of navigating immediately
        setShowOnboardingDialog(true);
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
    status, maxCallDuration, isNew, id, createAgent, updateAgent, navigate,
    iconName, iconColor, vadThreshold, vadSilenceDuration, vadPrefixPadding, selectedFolderId
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

  const handleStartTestCall = () => {
    setShowOnboardingDialog(false);
    if (newlyCreatedAgentId) {
      navigate(`/agents/${newlyCreatedAgentId}`, { replace: true });
      // Small delay to ensure navigation completes before opening dialog
      setTimeout(() => {
        setShowCallDialog(true);
      }, 100);
    }
  };

  const handleSkipTestCall = () => {
    setShowOnboardingDialog(false);
    if (newlyCreatedAgentId) {
      navigate(`/agents/${newlyCreatedAgentId}`, { replace: true });
    }
  };

  const handleSelectTemplate = (template: AgentTemplate) => {
    setAgentName(template.defaultValues.name);
    setDescription(template.defaultValues.description);
    setSystemPrompt(template.defaultValues.systemPrompt);
    setMaxCallDuration(template.defaultValues.maxCallDuration);
    setVoiceSpeed(template.defaultValues.voiceSpeed);
    setShowTemplates(false);
    setCurrentStep(1);
  };

  const handleSkipTemplates = () => {
    setShowTemplates(false);
    setCurrentStep(1);
  };

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-muted/30 mobile-safe-bottom">
          {/* Onboarding Dialog */}
          <Dialog open={showOnboardingDialog} onOpenChange={setShowOnboardingDialog}>
            <DialogContent className="sm:max-w-md">
              <div className="flex flex-col items-center text-center py-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <PartyPopper className="h-8 w-8 text-primary" />
                </div>
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-xl">
                    🎉 エージェントが完成しました！
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    <span className="font-medium text-foreground">{agentName}</span> が正常に作成されました。
                    <br />
                    今すぐテスト通話をして、エージェントと会話してみましょう！
                  </DialogDescription>
                </DialogHeader>
                
                <div className="w-full space-y-3 mt-6">
                  <Button
                    onClick={handleStartTestCall}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Phone className="h-5 w-5" />
                    テスト通話を開始
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={handleSkipTestCall}
                    className="w-full text-muted-foreground"
                  >
                    後でテストする
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 text-left w-full">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    テスト通話の流れ
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>1. マイクへのアクセスを許可します</li>
                    <li>2. エージェントが挨拶で応答します</li>
                    <li>3. 自由に会話してみましょう</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 sm:gap-4 min-h-[40px]">
              <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl hover:bg-muted">
                <Link to="/agents">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-lg sm:text-xl font-bold truncate tracking-tight leading-tight">
                  {isNew ? "新しいエージェント" : agentName || "エージェント編集"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate leading-tight">
                  {isNew ? "AIアシスタントを簡単に設定" : "エージェントの設定を編集"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto justify-end min-h-[40px]">
              {!isNew && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={status === "published" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSave(status === "published" ? "draft" : "published")}
                      disabled={isSaving}
                      className="gap-1.5 rounded-xl px-2.5 sm:px-3"
                    >
                      {status === "published" ? (
                        <>
                          <FileEdit className="h-4 w-4" />
                          <span className="hidden sm:inline">下書きに戻す</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4" />
                          <span className="hidden sm:inline">公開する</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden">
                    {status === "published" ? "下書きに戻す" : "公開する"}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {elevenlabsAgentId && (
                <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-2 px-2.5 sm:px-3">
                          <Phone className="h-4 w-4" />
                          <span className="hidden sm:inline">テスト通話</span>
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">
                      テスト通話
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
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
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => handleSave()}
                    disabled={isSaving || !canProceedToStep3}
                    className="gap-2 rounded-xl shadow-md shadow-primary/20 px-2.5 sm:px-3"
                    size="sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{isNew ? "作成" : "保存"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  {isNew ? "作成" : "保存"}
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Progress Steps */}
          {isNew && !showTemplates && (
            <div className="bg-background/80 backdrop-blur-sm border-b border-border px-4 py-4 sticky top-[73px] z-10">
              <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto">
                {[
                  { num: 1, label: "基本情報", icon: MessageSquare },
                  { num: 2, label: "音声設定", icon: Mic },
                  { num: 3, label: "確認", icon: CheckCircle2 },
                ].map((step, idx) => (
                  <div key={step.num} className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        if (step.num === 1) setCurrentStep(1);
                        else if (step.num === 2 && canProceedToStep2) setCurrentStep(2);
                        else if (step.num === 3 && canProceedToStep3) setCurrentStep(3);
                      }}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 ${
                        currentStep === step.num
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : currentStep > step.num
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        currentStep === step.num
                          ? "bg-primary-foreground/20"
                          : currentStep > step.num
                          ? "bg-primary/20"
                          : "bg-muted-foreground/20"
                      }`}>
                        {currentStep > step.num ? "✓" : step.num}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold hidden sm:block">{step.label}</span>
                    </button>
                    {idx < 2 && (
                      <div className={`w-6 sm:w-10 h-0.5 rounded-full transition-colors ${currentStep > step.num ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-auto py-4 md:py-8">
            <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-6">
              
              {/* Template Selection (only for new agents) */}
              {isNew && showTemplates && (
                <AgentTemplates
                  onSelectTemplate={handleSelectTemplate}
                  onSkip={handleSkipTemplates}
                />
              )}

              {/* Step 1: Basic Info */}
              {!showTemplates && (currentStep === 1 || !isNew) && (
                <Card className="border-2 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      基本情報
                    </CardTitle>
                    <CardDescription className="text-base">
                      エージェントの名前と役割を設定します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="flex items-center gap-2 text-base font-semibold">
                        エージェントの名前
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="例: 受付担当アシスタント"
                        className="text-base h-12"
                      />
                      <p className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                        💡 お客様に表示される名前です。わかりやすい名前をつけましょう
                      </p>
                    </div>

                    {/* Icon Picker */}
                    <AgentIconPicker
                      iconName={iconName}
                      iconColor={iconColor}
                      onIconChange={setIconName}
                      onColorChange={setIconColor}
                    />

                    {/* Folder Selection */}
                    {folders.length > 0 && (
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <Folder className="h-4 w-4" />
                          フォルダ
                        </Label>
                        <Select
                          value={selectedFolderId || "none"}
                          onValueChange={(value) => setSelectedFolderId(value === "none" ? null : value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="フォルダを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">フォルダなし</SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-sm"
                                    style={{ backgroundColor: folder.color }}
                                  />
                                  {folder.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                          💡 フォルダで整理すると管理しやすくなります
                        </p>
                      </div>
                    )}

                    <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="description" className="flex items-center gap-2 text-base font-bold text-foreground">
                            どんな役割ですか？
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p>AIに「何をしてほしいか」を教えてください。これがAIの性格や話し方に影響します。</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            このエージェントは何をする人ですか？
                          </p>
                        </div>
                      </div>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="例: お客様の予約・日程調整をサポートするAIアシスタントです。空き状況の確認や予約の変更にも対応します。"
                        rows={4}
                        className="resize-none text-base bg-background border-2 border-border focus:border-primary transition-colors"
                      />
                      <p className="text-sm text-muted-foreground flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg border border-amber-500/20">
                        💡 具体的に書くほど、AIが正確に動作します
                      </p>
                    </div>

                    <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-dashed border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="prompt" className="flex items-center gap-2 text-base font-bold text-foreground">
                              詳細な指示（上級者向け）
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p>省略OK！空欄の場合は上の「役割」から自動で作成されます。</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              より細かい動作を指定したい場合
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium shrink-0">省略可</span>
                      </div>
                      <Textarea
                        id="prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="例: あなたは親切で効率的な日程調整アシスタントです。&#10;&#10;【役割】&#10;お客様からの予約や日程調整のリクエストに対応します。"
                        rows={6}
                        className="resize-none text-sm bg-background border-2 border-border focus:border-primary transition-colors font-mono"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Voice Settings */}
              {!showTemplates && (currentStep === 2 || !isNew) && (
                <Card className="border-2 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Mic className="h-5 w-5 text-primary" />
                      </div>
                      声を選ぶ
                    </CardTitle>
                    <CardDescription className="text-base">
                      再生ボタン（▶）を押して、声を試聴してみましょう
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        🎧 <span className="font-semibold text-foreground">ヒント:</span> 各音声の横にある再生ボタンを押すと、声を確認できます
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-base font-medium">
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
                        <div className="space-y-4 max-h-80 overflow-auto p-1">
                          {/* Cloned Voices Section */}
                          {availableVoices.some(v => v.isCloned) && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1">
                                  <Mic className="h-3 w-3" />
                                  クローン音声
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  設定で作成したカスタム音声
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {availableVoices.filter(v => v.isCloned).map((voice) => (
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
                                      className="h-8 w-8 p-0 flex-shrink-0 rounded-full bg-primary/10"
                                      onClick={(e) => handleVoicePreview(e, voice)}
                                    >
                                      {playingPreviewId === voice.id ? (
                                        <Square className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate flex items-center gap-2">
                                        {voice.name}
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          カスタム
                                        </Badge>
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        あなたが作成した音声クローン
                                      </p>
                                    </div>
                                    {selectedVoice === voice.id && (
                                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Standard Voices Section */}
                          <div className="space-y-2">
                            {availableVoices.some(v => v.isCloned) && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1">
                                  標準音声
                                </Badge>
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-2">
                              {availableVoices.filter(v => !v.isCloned).map((voice) => (
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
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        話す速度
                        <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {voiceSpeed.toFixed(1)}x
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">🐢 ゆっくり</span>
                        <Slider
                          value={[voiceSpeed]}
                          onValueChange={([val]) => setVoiceSpeed(val)}
                          min={0.7}
                          max={1.3}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">速い 🐇</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        💡 1.0xが自然な速さです
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        最大通話時間
                        <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {maxCallDuration}分
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">1分</span>
                        <Slider
                          value={[maxCallDuration]}
                          onValueChange={([val]) => setMaxCallDuration(val)}
                          min={1}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">30分</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        💡 この時間を超えると通話が自動で終了します
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VAD Settings Section (only for existing agents) */}
              {!showTemplates && !isNew && (
                <Card className="border-2 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Volume2 className="h-5 w-5 text-primary" />
                      </div>
                      ノイズ制御
                    </CardTitle>
                    <CardDescription className="text-base">
                      周囲の雑音を拾いにくくする設定です
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        音声検出の感度
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>値が高いほど、雑音を無視して明確な音声のみを検出します。雑音が多い環境では高めに設定してください。</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded ml-auto">
                          {vadThreshold.toFixed(2)}
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">敏感</span>
                        <Slider
                          value={[vadThreshold]}
                          onValueChange={([val]) => setVadThreshold(val)}
                          min={0.1}
                          max={0.9}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">鈍感</span>
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                        💡 雑音が多い環境では 0.6〜0.8 に設定すると効果的です
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        無音判定時間
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>発話終了と判定するまでの無音時間です。長くすると話し終わりの間を多く取れます。</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded ml-auto">
                          {vadSilenceDuration}ms
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">短い</span>
                        <Slider
                          value={[vadSilenceDuration]}
                          onValueChange={([val]) => setVadSilenceDuration(val)}
                          min={200}
                          max={1500}
                          step={100}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">長い</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        発話開始パディング
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>発話検出前の音声も録音に含める時間です。冒頭が切れる場合は長くしてください。</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded ml-auto">
                          {vadPrefixPadding}ms
                        </span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">短い</span>
                        <Slider
                          value={[vadPrefixPadding]}
                          onValueChange={([val]) => setVadPrefixPadding(val)}
                          min={100}
                          max={800}
                          step={50}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">長い</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Knowledge Base Section (only for existing agents) */}
              {!showTemplates && !isNew && (
                <AgentKnowledgeSection agentId={id} isNew={isNew} />
              )}

              {/* Step 3: Review */}
              {!showTemplates && currentStep === 3 && isNew && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      準備完了！
                    </CardTitle>
                    <CardDescription>
                      あと少しで完成です。内容を確認してください
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{agentName}</p>
                          <p className="text-sm text-muted-foreground">あなたのAIアシスタント</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-xs text-muted-foreground mb-1">🎤 音声</p>
                          <p className="font-medium">{selectedVoiceData?.name || "未選択"}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-xs text-muted-foreground mb-1">⚡ 速度</p>
                          <p className="font-medium">{voiceSpeed.toFixed(1)}x</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-xs text-muted-foreground mb-1">⏱️ 最大時間</p>
                          <p className="font-medium">{maxCallDuration}分</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-xs text-muted-foreground mb-1">📝 状態</p>
                          <p className="font-medium">下書き</p>
                        </div>
                      </div>
                      
                      {description && (
                        <div className="pt-3 border-t border-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">💼 役割</p>
                          <p className="text-sm">{description}</p>
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
              {isNew && !showTemplates && (
                <div className="flex justify-between pt-4">
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      戻る
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowTemplates(true)}
                      className="gap-2"
                    >
                      <LayoutTemplate className="h-4 w-4" />
                      テンプレート一覧
                    </Button>
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
