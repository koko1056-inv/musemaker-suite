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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          音声クローン
        </CardTitle>
        <CardDescription>
          音声サンプルをアップロードして、カスタム音声を作成できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            クローンには、はっきりとした発声の音声サンプルが必要です。
            ノイズが少なく、1〜2分程度の音声が理想的です。
          </AlertDescription>
        </Alert>

        {/* Voice Name */}
        <div className="space-y-2">
          <Label htmlFor="voice-name">音声の名前 *</Label>
          <Input
            id="voice-name"
            placeholder="例: 田中さんの声"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="voice-description">説明（任意）</Label>
          <Textarea
            id="voice-description"
            placeholder="この音声についての説明を入力..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>音声サンプル（1〜25ファイル）</Label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-primary/50 border-muted-foreground/25"
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
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">クリックしてファイルを選択</p>
              <p className="text-sm text-muted-foreground">
                MP3, WAV, WebM, OGG, M4A（最大10MB/ファイル）
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {audioFiles.length > 0 && (
          <div className="space-y-2">
            <Label>選択されたファイル（{audioFiles.length}件）</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {audioFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
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
          <Alert className="border-success bg-success/10">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              音声クローンが作成されました！エージェント設定の音声一覧に追加されています。
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleCloneVoice}
          disabled={isLoading || !voiceName.trim() || audioFiles.length === 0}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              作成中...
            </>
          ) : (
            "音声クローンを作成"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
