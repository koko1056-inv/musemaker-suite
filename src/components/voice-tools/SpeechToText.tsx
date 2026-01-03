import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileAudio, Loader2, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const LANGUAGES = [
  { code: "jpn", label: "日本語" },
  { code: "eng", label: "英語" },
  { code: "kor", label: "韓国語" },
  { code: "cmn", label: "中国語" },
  { code: "spa", label: "スペイン語" },
  { code: "fra", label: "フランス語" },
  { code: "deu", label: "ドイツ語" },
];

export function SpeechToText() {
  const [isLoading, setIsLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [languageCode, setLanguageCode] = useState("jpn");
  const [transcription, setTranscription] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|ogg|m4a)$/i)) {
        toast.error("対応していない形式です。MP3、WAV、WebM、OGG、M4Aをお使いください。");
        return;
      }
      
      // Check file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        toast.error("ファイルサイズは25MB以下にしてください。");
        return;
      }
      
      setAudioFile(file);
      setTranscription("");
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("音声ファイルを選択してください。");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("language_code", languageCode);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "文字起こしに失敗しました");
      }

      const result = await response.json();
      setTranscription(result.text || "");
      toast.success("文字起こしが完了しました！");
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error(error instanceof Error ? error.message : "文字起こしに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (transcription) {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      toast.success("コピーしました！");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setAudioFile(null);
    setTranscription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileAudio className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          音声文字起こし
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          録音ファイルをテキストに変換します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">① 音声ファイルを選択</Label>
          <div
            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors cursor-pointer hover:border-primary/50 active:bg-muted/50 ${
              audioFile ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a"
              className="hidden"
              onChange={handleFileSelect}
            />
            {audioFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileAudio className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-foreground text-sm sm:text-base">{audioFile.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground text-sm sm:text-base">タップしてファイルを選択</p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV など（最大25MB）
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">② 言語を選択</Label>
          <Select value={languageCode} onValueChange={setLanguageCode}>
            <SelectTrigger className="h-11 sm:h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="py-3 sm:py-2">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTranscribe}
            disabled={!audioFile || isLoading}
            className="flex-1 h-12 sm:h-10 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                変換中...
              </>
            ) : (
              <>③ 文字起こしを開始</>
            )}
          </Button>
          {audioFile && (
            <Button variant="outline" onClick={handleClear} className="h-12 sm:h-10 w-12 sm:w-10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Result */}
        {transcription && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-primary">✓ 結果</Label>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-9 px-3">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success mr-1" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    コピー
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={transcription}
              readOnly
              className="min-h-[120px] sm:min-h-[150px] resize-none text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
