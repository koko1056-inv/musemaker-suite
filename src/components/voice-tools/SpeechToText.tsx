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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          音声文字起こし
        </CardTitle>
        <CardDescription>
          音声ファイルをアップロードして、テキストに変換できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label>音声ファイル</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-primary/50 ${
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
                <FileAudio className="h-10 w-10 text-primary" />
                <p className="font-medium text-foreground">{audioFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">クリックしてファイルを選択</p>
                <p className="text-sm text-muted-foreground">
                  MP3, WAV, WebM, OGG, M4A（最大25MB）
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label>言語</Label>
          <Select value={languageCode} onValueChange={setLanguageCode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
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
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                変換中...
              </>
            ) : (
              "文字起こしを開始"
            )}
          </Button>
          {audioFile && (
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Result */}
        {transcription && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>結果</Label>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={transcription}
              readOnly
              className="min-h-[150px] resize-none"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
