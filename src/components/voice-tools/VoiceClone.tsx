import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Mic, Loader2, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function VoiceClone() {
  const [isLoading, setIsLoading] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a'];
      const isValidType = validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|webm|ogg|m4a)$/i);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max per file
      
      if (!isValidType) {
        toast.error(`${file.name}: 対応していない形式です`);
      }
      if (!isValidSize) {
        toast.error(`${file.name}: ファイルサイズは10MB以下にしてください`);
      }
      
      return isValidType && isValidSize;
    });

    setAudioFiles((prev) => [...prev, ...validFiles].slice(0, 25)); // Max 25 files
    setSuccess(false);
  };

  const removeFile = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCloneVoice = async () => {
    if (!voiceName.trim()) {
      toast.error("音声の名前を入力してください。");
      return;
    }

    if (audioFiles.length === 0) {
      toast.error("少なくとも1つの音声ファイルを追加してください。");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", voiceName);
      formData.append("description", description);
      
      for (const file of audioFiles) {
        formData.append("files", file);
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-voice-clone`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "音声クローンの作成に失敗しました");
      }

      const result = await response.json();
      console.log("Voice clone result:", result);
      
      setSuccess(true);
      toast.success("音声クローンが作成されました！");
      
      // Reset form
      setVoiceName("");
      setDescription("");
      setAudioFiles([]);
    } catch (error) {
      console.error("Voice clone error:", error);
      toast.error(error instanceof Error ? error.message : "音声クローンの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          音声クローン
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          あなただけのカスタム音声を作成
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            はっきりとした発声の音声サンプル（1〜2分程度）をご用意ください
          </AlertDescription>
        </Alert>

        {/* Voice Name */}
        <div className="space-y-2">
          <Label htmlFor="voice-name" className="text-sm font-medium">① 音声の名前 <span className="text-destructive">*</span></Label>
          <Input
            id="voice-name"
            placeholder="例: 田中さんの声"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="h-11 sm:h-10 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="voice-description" className="text-sm font-medium">② 説明（任意）</Label>
          <Textarea
            id="voice-description"
            placeholder="この音声についてのメモ..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none text-sm"
            rows={2}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">③ 音声サンプルをアップロード</Label>
          <div
            className="border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors cursor-pointer hover:border-primary/50 active:bg-muted/50 border-muted-foreground/25"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground text-sm sm:text-base">タップしてファイルを選択</p>
              <p className="text-xs text-muted-foreground">
                1〜25ファイル（各10MBまで）
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {audioFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-primary">選択済み: {audioFiles.length}件</Label>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {audioFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="border-success bg-success/10 py-3">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success text-sm">
              音声クローンが作成されました！エージェント設定で選択できます。
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleCloneVoice}
          disabled={isLoading || !voiceName.trim() || audioFiles.length === 0}
          className="w-full h-12 sm:h-10 text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              作成中...
            </>
          ) : (
            <>④ 音声クローンを作成</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
