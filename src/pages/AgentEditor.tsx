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
  Variable,
  ChevronDown,
  ChevronUp,
  Settings2,
  Wand2,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AgentTemplates, AgentTemplate } from "@/components/agents/AgentTemplates";
import { AgentIconPicker } from "@/components/agents/AgentIconPicker";
import { AgentKnowledgeSection } from "@/components/agents/AgentKnowledgeSection";
import { AgentExtractionFields } from "@/components/agents/AgentExtractionFields";
import { AIAgentBuilder } from "@/components/agents/AIAgentBuilder";
import { EasySetupWizard } from "@/components/agents/EasySetupWizard";
import { CreationMethodSelector } from "@/components/agents/CreationMethodSelector";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

// Step indicator component
const StepIndicator = ({
  step,
  currentStep,
  label,
  isComplete,
  onClick
}: {
  step: number;
  currentStep: number;
  label: string;
  isComplete: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
      currentStep === step
        ? "bg-primary text-primary-foreground"
        : isComplete
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground"
    }`}
  >
    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
      currentStep === step
        ? "bg-primary-foreground/20"
        : isComplete
        ? "bg-primary/20"
        : "bg-muted-foreground/20"
    }`}>
      {isComplete && currentStep !== step ? "✓" : step}
    </div>
    <span className="text-sm font-medium hidden sm:block">{label}</span>
  </button>
);

// Collapsible section for existing agent editing
const EditorSection = ({
  title,
  description,
  icon: Icon,
  iconBg,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  description: string;
  icon: any;
  iconBg: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-xl overflow-hidden bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {badge && (
                  <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default function AgentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = id === "new";
  const creationMethod = searchParams.get("method");
  
  // Show creation method selector for new agents without a specific method
  const shouldShowMethodSelector = isNew && !creationMethod;
  const shouldShowTemplates = isNew && creationMethod === "template";
  const shouldShowAIBuilder = isNew && creationMethod === "ai";
  const shouldShowEasySetup = isNew && creationMethod === "easy";
  
  const [isLoadingAgent, setIsLoadingAgent] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(shouldShowMethodSelector);
  const [showTemplates, setShowTemplates] = useState(shouldShowTemplates);
  const [showAIBuilder, setShowAIBuilder] = useState(shouldShowAIBuilder);
  const [showEasySetup, setShowEasySetup] = useState(shouldShowEasySetup);
  const [currentStep, setCurrentStep] = useState(1);
  const [extractionFieldsToAdd, setExtractionFieldsToAdd] = useState<string[]>([]);
  
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
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // VAD settings
  const [vadThreshold, setVadThreshold] = useState(0.5);
  const [vadSilenceDuration, setVadSilenceDuration] = useState(500);
  const [vadPrefixPadding, setVadPrefixPadding] = useState(300);
  
  // First message
  const [firstMessage, setFirstMessage] = useState("こんにちは！本日はどのようなご用件でしょうか？");
  
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [newlyCreatedAgentId, setNewlyCreatedAgentId] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [showEditPromptDialog, setShowEditPromptDialog] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");

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
          setCustomIconUrl((agent as any).custom_icon_url || null);
          setSelectedFolderId(agent.folder_id || null);
          setVadThreshold((agent as any).vad_threshold ?? 0.5);
          setVadSilenceDuration((agent as any).vad_silence_duration_ms ?? 500);
          setVadPrefixPadding((agent as any).vad_prefix_padding_ms ?? 300);
          setFirstMessage((agent as any).first_message || "こんにちは！本日はどのようなご用件でしょうか？");
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
        custom_icon_url: customIconUrl,
        folder_id: selectedFolderId,
        vad_mode: "server_vad",
        vad_threshold: vadThreshold,
        vad_silence_duration_ms: vadSilenceDuration,
        vad_prefix_padding_ms: vadPrefixPadding,
        first_message: firstMessage || undefined,
      };

      if (isNew) {
        const newAgent = await createAgent(agentData as any);
        setElevenLabsAgentId(newAgent.elevenlabs_agent_id || null);
        setNewlyCreatedAgentId(newAgent.id);
        
        // かんたんセットアップで設定された抽出フィールドを自動追加
        if (extractionFieldsToAdd.length > 0) {
          const fieldsToInsert = extractionFieldsToAdd.map((fieldName, index) => ({
            agent_id: newAgent.id,
            field_name: fieldName,
            field_key: fieldName.toLowerCase().replace(/[\/\s]/g, "_").replace(/[^a-z0-9_]/g, ""),
            field_type: "text",
            description: `${fieldName}を抽出します`,
            is_required: index < 2, // 最初の2つは必須に設定
          }));

          const { error: fieldsError } = await supabase
            .from("agent_extraction_fields")
            .insert(fieldsToInsert);

          if (fieldsError) {
            console.error("Error adding extraction fields:", fieldsError);
            toast.error("抽出フィールドの追加に失敗しました");
          } else {
            toast.success(`${extractionFieldsToAdd.length}件の抽出フィールドを追加しました`);
          }
          
          // 追加後はクリア
          setExtractionFieldsToAdd([]);
        }
        
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
    iconName, iconColor, customIconUrl, vadThreshold, vadSilenceDuration, vadPrefixPadding, selectedFolderId, firstMessage, extractionFieldsToAdd
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
    setShowMethodSelector(false);
    setCurrentStep(1);
  };

  const handleSkipTemplates = () => {
    setShowTemplates(false);
    setShowMethodSelector(true);
  };

  const handleAIConfigReady = (template: AgentTemplate) => {
    setAgentName(template.defaultValues.name);
    setDescription(template.defaultValues.description);
    setSystemPrompt(template.defaultValues.systemPrompt);
    setMaxCallDuration(template.defaultValues.maxCallDuration);
    setVoiceSpeed(template.defaultValues.voiceSpeed);
    setShowAIBuilder(false);
    setShowMethodSelector(false);
    setCurrentStep(1);
  };

  const handleSkipAIBuilder = () => {
    setShowAIBuilder(false);
    setShowMethodSelector(true);
  };

  const handleSelectCreationMethod = (method: "easy" | "ai" | "template" | "manual") => {
    setShowMethodSelector(false);
    if (method === "easy") {
      setShowEasySetup(true);
    } else if (method === "ai") {
      setShowAIBuilder(true);
    } else if (method === "template") {
      setShowTemplates(true);
    }
    // manual の場合は何も表示せず、直接ステップウィザードへ
  };

  const handleEasySetupComplete = (config: {
    name: string;
    description: string;
    systemPrompt: string;
    firstMessage: string;
    extractionFields: string[];
  }) => {
    setAgentName(config.name);
    setDescription(config.description);
    setSystemPrompt(config.systemPrompt);
    setFirstMessage(config.firstMessage);
    setExtractionFieldsToAdd(config.extractionFields);
    setShowEasySetup(false);
    setShowMethodSelector(false);
    setCurrentStep(2); // 音声選択ステップへ
  };

  const handleEasySetupBack = () => {
    setShowEasySetup(false);
    setShowMethodSelector(true);
  };

  const handleGeneratePrompt = async () => {
    if (!description.trim()) {
      toast.error("概要を入力してください");
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-agent-prompt', {
        body: { agentName, description, language: 'ja' }
      });

      if (error) throw error;

      if (data?.prompt) {
        setSystemPrompt(data.prompt);
        setShowAdvanced(true);
        toast.success("プロンプトを生成しました！");
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error("プロンプトの生成に失敗しました");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleEditPromptWithAI = async () => {
    if (!systemPrompt.trim() || !editInstruction.trim()) {
      toast.error("プロンプトと編集指示を入力してください");
      return;
    }

    setIsEditingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-agent-prompt', {
        body: { 
          action: 'edit',
          currentPrompt: systemPrompt,
          editInstruction,
          language: 'ja'
        }
      });

      if (error) throw error;

      if (data?.prompt) {
        setSystemPrompt(data.prompt);
        setShowEditPromptDialog(false);
        setEditInstruction("");
        toast.success("プロンプトを編集しました！");
      }
    } catch (error) {
      console.error("Error editing prompt:", error);
      toast.error("プロンプトの編集に失敗しました");
    } finally {
      setIsEditingPrompt(false);
    }
  };

  // Render for existing agent (collapsible sections)
  const renderExistingAgentEditor = () => (
    <div className="space-y-4">
      {/* Quick Status Bar */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
        <div 
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Bot className="h-6 w-6" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{agentName || "エージェント"}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={status === "published" ? "default" : "secondary"} className="text-xs">
              {status === "published" ? "公開中" : "下書き"}
            </Badge>
            {elevenlabsAgentId && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
                通話可能
              </Badge>
            )}
          </div>
        </div>
        {elevenlabsAgentId && (
          <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Phone className="h-4 w-4" />
                テスト通話
              </Button>
            </DialogTrigger>
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
      </div>

      {/* Basic Info Section */}
      <EditorSection
        title="基本情報"
        description="名前と役割の設定"
        icon={MessageSquare}
        iconBg="bg-blue-500/10 text-blue-500"
        defaultOpen={true}
      >
        <div className="pt-4 space-y-4 sm:space-y-5">
          {/* Name Input */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              エージェント名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="例: 受付担当アシスタント"
              className="h-10 sm:h-11"
            />
          </div>

        </div>
      </EditorSection>

      {/* System Prompt - Full Width Prominent Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-2 border-primary/30 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-foreground">システムプロンプト</h3>
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">重要</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                ここを編集すると、エージェントの<span className="text-primary font-medium">話し方</span>・<span className="text-primary font-medium">対応方法</span>・<span className="text-primary font-medium">回答スタイル</span>を自由にカスタマイズできます。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt || !description.trim()}
              className="gap-2"
            >
              {isGeneratingPrompt ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              AIで生成
            </Button>
            <Dialog open={showEditPromptDialog} onOpenChange={setShowEditPromptDialog}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!systemPrompt.trim()}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  AIで編集
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AIでプロンプトを編集
                  </DialogTitle>
                  <DialogDescription>
                    現在のプロンプトをAIで編集・改善します。どのように変更したいか指示してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-3 rounded-lg bg-muted/50 border text-xs max-h-32 overflow-auto">
                    <p className="text-muted-foreground font-mono whitespace-pre-wrap">
                      {systemPrompt.length > 200 ? systemPrompt.substring(0, 200) + "..." : systemPrompt}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editInstruction" className="text-sm font-medium">
                      編集指示
                    </Label>
                    <Textarea
                      id="editInstruction"
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="例：&#10;・もっと丁寧な言葉遣いにして&#10;・クレーム対応の方法を追加して&#10;・回答できない場合の対応を追加して"
                      rows={4}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["より丁寧に", "より簡潔に", "詳細を追加", "クレーム対応追加"].map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setEditInstruction(prev => prev ? `${prev}\n・${suggestion}` : suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditPromptDialog(false);
                      setEditInstruction("");
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEditPromptWithAI}
                    disabled={isEditingPrompt || !editInstruction.trim()}
                    className="gap-2"
                  >
                    {isEditingPrompt ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    編集を適用
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Textarea
          id="prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="詳細な動作指示を入力...&#10;&#10;例：&#10;あなたは丁寧なカスタマーサポート担当です。&#10;お客様の質問に対して、親切で分かりやすい回答を心がけてください。&#10;クレームの場合は謝罪から始め、担当者への折り返しを提案してください。"
          rows={10}
          className="resize-y font-mono text-sm bg-background/90 min-h-[200px]"
        />
      </div>

      {/* Additional Settings */}
      <EditorSection
        title="追加設定"
        description="アイコン・フォルダ・説明"
        icon={Settings2}
        iconBg="bg-slate-500/10 text-slate-500"
        defaultOpen={false}
      >
        <div className="pt-4 space-y-4 sm:space-y-5">
          {/* Icon & Folder Row - Stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm font-medium">アイコン</Label>
              <AgentIconPicker
                iconName={iconName}
                iconColor={iconColor}
                customIconUrl={customIconUrl || undefined}
                onIconChange={setIconName}
                onColorChange={setIconColor}
                onCustomIconChange={setCustomIconUrl}
              />
            </div>
            {folders.length > 0 && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm font-medium">フォルダ</Label>
                <Select
                  value={selectedFolderId || "none"}
                  onValueChange={(value) => setSelectedFolderId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-popover">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="none">なし</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: folder.color }} />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              役割・説明（メモ用）
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このエージェントは何をしますか？（AIで生成ボタンを使う場合はここに詳細を書いてください）"
              rows={3}
              className="resize-none text-sm sm:text-base"
            />
          </div>
        </div>
      </EditorSection>

      {/* Voice Section */}
      <EditorSection
        title="音声設定"
        description={selectedVoiceData ? `選択中: ${selectedVoiceData.name}` : "声と話し方の設定"}
        icon={Mic}
        iconBg="bg-purple-500/10 text-purple-500"
        badge={selectedVoiceData?.name}
      >
        <div className="pt-4 space-y-4 sm:space-y-5">
          {/* Voice Selection */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">音声を選択</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsLoadingVoices(true);
                  const fetchedVoices = await fetchVoices();
                  if (fetchedVoices) setAvailableVoices(fetchedVoices);
                  setIsLoadingVoices(false);
                }}
                disabled={isLoadingVoices}
                className="h-7 px-2 text-xs gap-1"
              >
                {isLoadingVoices ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                <span className="hidden sm:inline">更新</span>
              </Button>
            </div>
            
            {isLoadingVoices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[280px] sm:max-h-60 overflow-auto rounded-lg border bg-muted/30 p-2">
                {availableVoices.slice(0, 12).map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-all ${
                      selectedVoice === voice.id
                        ? "bg-primary/10 border border-primary shadow-sm"
                        : "bg-background border border-transparent hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <Button
                      variant={selectedVoice === voice.id ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 shrink-0 rounded-full"
                      onClick={(e) => handleVoicePreview(e, voice)}
                    >
                      {playingPreviewId === voice.id ? (
                        <Square className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{voice.name}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {voice.labels?.gender && (
                          <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {voice.labels.gender === "female" ? "女性" : "男性"}
                          </span>
                        )}
                        {voice.isCloned && (
                          <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                            カスタム
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedVoice === voice.id && (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed & Duration - Stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  話す速度
                </span>
                <span className="text-primary font-medium text-xs sm:text-sm bg-primary/10 px-2 py-0.5 rounded">
                  {voiceSpeed.toFixed(1)}x
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">遅</span>
                <Slider
                  value={[voiceSpeed]}
                  onValueChange={([val]) => setVoiceSpeed(val)}
                  min={0.7}
                  max={1.3}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground">速</span>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  最大通話時間
                </span>
                <span className="text-primary font-medium text-xs sm:text-sm bg-primary/10 px-2 py-0.5 rounded">
                  {maxCallDuration}分
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">1分</span>
                <Slider
                  value={[maxCallDuration]}
                  onValueChange={([val]) => setMaxCallDuration(val)}
                  min={1}
                  max={30}
                  step={1}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground">30分</span>
              </div>
            </div>
          </div>
        </div>
      </EditorSection>

      {/* First Message Section */}
      <EditorSection
        title="最初の発話"
        description="通話開始時にエージェントが最初に話す内容"
        icon={MessageSquare}
        iconBg="bg-green-500/10 text-green-500"
        defaultOpen={true}
      >
        <div className="pt-4 space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 border text-xs sm:text-sm space-y-1.5">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">通話が開始されると...</p>
                <p className="text-muted-foreground">
                  エージェントはこのメッセージを最初に発話します。お客様への第一印象を決める重要なメッセージです。
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="firstMessage" className="text-sm font-medium">
              挨拶メッセージ
            </Label>
            <Textarea
              id="firstMessage"
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder="例: こんにちは！本日はどのようなご用件でしょうか？"
              rows={3}
              className="resize-none text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground">
              💡 自然で親しみやすい挨拶を設定しましょう
            </p>
          </div>
        </div>
      </EditorSection>

      {/* VAD Section */}
      <EditorSection
        title="ノイズ制御"
        description="雑音対策の設定"
        icon={Volume2}
        iconBg="bg-orange-500/10 text-orange-500"
        defaultOpen={false}
      >
        <div className="pt-4 space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center justify-between">
              音声検出の感度
              <span className="text-primary font-normal">{vadThreshold.toFixed(2)}</span>
            </Label>
            <Slider
              value={[vadThreshold]}
              onValueChange={([val]) => setVadThreshold(val)}
              min={0.1}
              max={0.9}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">雑音が多い環境では高めに設定</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center justify-between">
              無音判定時間
              <span className="text-primary font-normal">{vadSilenceDuration}ms</span>
            </Label>
            <Slider
              value={[vadSilenceDuration]}
              onValueChange={([val]) => setVadSilenceDuration(val)}
              min={200}
              max={1500}
              step={100}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center justify-between">
              発話開始パディング
              <span className="text-primary font-normal">{vadPrefixPadding}ms</span>
            </Label>
            <Slider
              value={[vadPrefixPadding]}
              onValueChange={([val]) => setVadPrefixPadding(val)}
              min={100}
              max={800}
              step={50}
            />
          </div>
        </div>
      </EditorSection>

      {/* Extraction Fields */}
      {id && (
        <EditorSection
          title="抽出変数"
          description="通話から自動抽出する情報"
          icon={Variable}
          iconBg="bg-violet-500/10 text-violet-500"
          defaultOpen={false}
        >
          <div className="pt-4">
            <AgentExtractionFields agentId={id} />
          </div>
        </EditorSection>
      )}

      {/* Knowledge Base Section */}
      <AgentKnowledgeSection agentId={id} isNew={Boolean(isNew)} />
    </div>
  );

  // Render for new agent (step-by-step wizard)
  const renderNewAgentWizard = () => (
    <div className="space-y-6">
      {/* Step 1: Name & Role */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">エージェントに名前をつけよう</h2>
            <p className="text-muted-foreground mt-2">まずは基本的な情報から始めましょう</p>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                エージェント名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="例: 受付担当アシスタント"
                className="h-12 text-base"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                どんな仕事をしますか？
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: お客様の電話を受け、予約や問い合わせに対応します。営業時間の案内や、担当者への取り次ぎも行います。"
                rows={4}
                className="resize-none text-base"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  💡 具体的に書くと、AIがより正確に動作します
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePrompt}
                  disabled={isGeneratingPrompt || !description.trim()}
                  className="gap-2 shrink-0"
                >
                  {isGeneratingPrompt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  AIでプロンプト生成
                </Button>
              </div>
            </div>

            {/* Generated System Prompt Preview */}
            {systemPrompt && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  生成されたシステムプロンプト
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {systemPrompt}
                </p>
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger className="text-xs text-primary hover:underline">
                    {showAdvanced ? "閉じる" : "全文を見る / 編集する"}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={8}
                      className="resize-none text-sm font-mono"
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Optional: Folder & Icon */}
            <div className="pt-4 border-t">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Settings2 className="h-4 w-4" />
                  アイコン・フォルダを設定（任意）
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <AgentIconPicker
                    iconName={iconName}
                    iconColor={iconColor}
                    onIconChange={setIconName}
                    onColorChange={setIconColor}
                  />
                  {folders.length > 0 && (
                    <Select
                      value={selectedFolderId || "none"}
                      onValueChange={(value) => setSelectedFolderId(value === "none" ? null : value)}
                    >
                      <SelectTrigger className="bg-popover">
                        <SelectValue placeholder="フォルダを選択" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="none">フォルダなし</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Voice Selection */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 mb-4">
              <Mic className="h-8 w-8 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold">声を選ぼう</h2>
            <p className="text-muted-foreground mt-2">再生ボタンを押して、声を試聴できます</p>
          </div>

          {isLoadingVoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <div className="grid gap-2 max-h-[400px] overflow-auto">
                {availableVoices.slice(0, 15).map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      selectedVoice === voice.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 shrink-0 rounded-full"
                      onClick={(e) => handleVoicePreview(e, voice)}
                    >
                      {playingPreviewId === voice.id ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{voice.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {voice.labels?.gender === "female" ? "女性" : voice.labels?.gender === "male" ? "男性" : ""}
                        {voice.isCloned && " • カスタム音声"}
                      </p>
                    </div>
                    {selectedVoice === voice.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Speed Slider */}
              <div className="pt-4 border-t space-y-3">
                <Label className="flex items-center justify-between">
                  話す速度
                  <span className="text-primary">{voiceSpeed.toFixed(1)}x</span>
                </Label>
                <div className="flex items-center gap-3">
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
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">準備完了！</h2>
            <p className="text-muted-foreground mt-2">内容を確認して作成しましょう</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="h-14 w-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${iconColor}20` }}
                >
                  <Bot className="h-7 w-7" style={{ color: iconColor }} />
                </div>
                <div>
                  <p className="font-bold text-lg">{agentName}</p>
                  <p className="text-sm text-muted-foreground">新しいAIアシスタント</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">🎤 音声</p>
                  <p className="font-medium text-sm">{selectedVoiceData?.name || "未選択"}</p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">⚡ 速度</p>
                  <p className="font-medium text-sm">{voiceSpeed.toFixed(1)}x</p>
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
              className="w-full mt-6 gap-2 h-12 text-base"
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              エージェントを作成
            </Button>
          </div>
        </div>
      )}
    </div>
  );

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
                  <Button onClick={handleStartTestCall} className="w-full gap-2" size="lg">
                    <Phone className="h-5 w-5" />
                    テスト通話を開始
                  </Button>
                  
                  <Button variant="ghost" onClick={handleSkipTestCall} className="w-full text-muted-foreground">
                    後でテストする
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Header */}
          <header className="flex items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl">
                <Link to="/agents">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {isNew ? "新しいエージェント" : agentName || "エージェント編集"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isNew && (
                <Button
                  variant={status === "published" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSave(status === "published" ? "draft" : "published")}
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  {status === "published" ? <FileEdit className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  <span className="hidden sm:inline">{status === "published" ? "下書きに戻す" : "公開する"}</span>
                </Button>
              )}
              
              <Button 
                onClick={() => handleSave()}
                disabled={isSaving || !canProceedToStep3}
                className="gap-2"
                size="sm"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{isNew ? "作成" : "保存"}</span>
              </Button>
            </div>
          </header>

          {/* Progress Steps (for new agents, not during selection screens) */}
          {isNew && !showTemplates && !showAIBuilder && !showMethodSelector && !showEasySetup && (
            <div className="bg-background border-b border-border px-4 py-3 sticky top-[65px] z-10">
              <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                <StepIndicator 
                  step={1} 
                  currentStep={currentStep} 
                  label="基本情報" 
                  isComplete={canProceedToStep2}
                  onClick={() => setCurrentStep(1)}
                />
                <div className={`w-8 h-0.5 rounded ${currentStep > 1 ? 'bg-primary' : 'bg-border'}`} />
                <StepIndicator 
                  step={2} 
                  currentStep={currentStep} 
                  label="音声" 
                  isComplete={Boolean(canProceedToStep3)}
                  onClick={() => canProceedToStep2 && setCurrentStep(2)}
                />
                <div className={`w-8 h-0.5 rounded ${currentStep > 2 ? 'bg-primary' : 'bg-border'}`} />
                <StepIndicator 
                  step={3} 
                  currentStep={currentStep} 
                  label="確認" 
                  isComplete={false}
                  onClick={() => canProceedToStep3 && setCurrentStep(3)}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-auto py-6 md:py-8">
            <div className={`mx-auto px-4 md:px-6 ${showEasySetup ? 'max-w-5xl' : 'max-w-2xl'}`}>
              
              {/* Creation Method Selector */}
              {isNew && showMethodSelector && (
                <CreationMethodSelector onSelectMethod={handleSelectCreationMethod} />
              )}

              {/* Easy Setup Wizard */}
              {isNew && showEasySetup && (
                <EasySetupWizard 
                  onComplete={handleEasySetupComplete} 
                  onBack={handleEasySetupBack} 
                />
              )}

              {/* Template Selection */}
              {isNew && showTemplates && (
                <AgentTemplates onSelectTemplate={handleSelectTemplate} onSkip={handleSkipTemplates} />
              )}

              {/* AI Builder */}
              {isNew && showAIBuilder && (
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">AIアシストで作成</h2>
                    <p className="text-muted-foreground">会話形式で最適なエージェント設定を生成します</p>
                  </div>
                  <AIAgentBuilder onConfigReady={handleAIConfigReady} />
                  <div className="mt-4 text-center">
                    <Button variant="ghost" onClick={handleSkipAIBuilder}>スキップして手動で設定</Button>
                  </div>
                </div>
              )}

              {/* New Agent Wizard */}
              {isNew && !showTemplates && !showAIBuilder && !showMethodSelector && !showEasySetup && renderNewAgentWizard()}

              {/* Existing Agent Editor */}
              {!isNew && !showTemplates && !showAIBuilder && renderExistingAgentEditor()}

              {/* Navigation Buttons (for new agents) */}
              {isNew && !showTemplates && !showAIBuilder && !showMethodSelector && !showEasySetup && (
                <div className="flex justify-between pt-6 border-t mt-8">
                  {currentStep > 1 ? (
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                      戻る
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => setShowMethodSelector(true)} className="gap-2">
                      <Zap className="h-4 w-4" />
                      作成方法を変更
                    </Button>
                  )}
                  
                  {currentStep < 3 && (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={currentStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
                      className="gap-2"
                    >
                      次へ
                      <ArrowRight className="h-4 w-4" />
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
