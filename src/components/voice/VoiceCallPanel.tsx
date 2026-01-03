import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Loader2,
  MessageSquare,
  Volume2 
} from 'lucide-react';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';

interface VoiceCallPanelProps {
  agentId: string;
  elevenLabsAgentId: string;
  agentName: string;
  onCallEnd?: () => void;
}

// Audio level indicator component
function AudioLevelIndicator({ level, isActive }: { level: number; isActive: boolean }) {
  const bars = 5;
  const normalizedLevel = Math.min(1, Math.max(0, level));
  const activeBars = Math.ceil(normalizedLevel * bars);

  return (
    <div className="flex items-center gap-0.5 h-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-75 ${
            isActive && i < activeBars
              ? i < 2
                ? 'bg-green-500'
                : i < 4
                ? 'bg-yellow-500'
                : 'bg-red-500'
              : 'bg-muted-foreground/30'
          }`}
          style={{
            height: `${40 + i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}

export function VoiceCallPanel({ 
  agentId, 
  elevenLabsAgentId, 
  agentName,
  onCallEnd 
}: VoiceCallPanelProps) {
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const animationFrameRef = useRef<number>();

  const {
    isConnecting,
    isSaving,
    isConnected,
    isSpeaking,
    transcript,
    startConversation,
    endConversation,
    conversation,
  } = useVoiceConversation({
    agentId,
    elevenLabsAgentId,
    onConversationEnd: () => {
      onCallEnd?.();
    },
  });

  // Monitor audio levels when connected
  useEffect(() => {
    if (!isConnected || !conversation) {
      setInputLevel(0);
      setOutputLevel(0);
      return;
    }

    const updateLevels = () => {
      try {
        const input = conversation.getInputVolume?.() || 0;
        const output = conversation.getOutputVolume?.() || 0;
        setInputLevel(input);
        setOutputLevel(output);
      } catch {
        // Ignore errors when getting volume
      }
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isConnected, conversation]);

  return (
    <Card className="w-full max-w-md mx-auto border-0 sm:border">
      <CardHeader className="text-center pb-2 sm:pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          {agentName}
        </CardTitle>
        <div className="flex justify-center gap-2 mt-2">
          {isConnected ? (
            <>
              <Badge variant="default" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                通話中
              </Badge>
              {isSpeaking && (
                <Badge variant="secondary" className="gap-1">
                  <Volume2 className="h-3 w-3" />
                  話し中
                </Badge>
              )}
            </>
          ) : isSaving ? (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              保存中...
            </Badge>
          ) : (
            <Badge variant="outline">待機中</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        {/* Audio Level Indicators */}
        {isConnected && (
          <div className="flex justify-center gap-8 py-2 px-4 rounded-lg bg-muted/30">
            <div className="flex flex-col items-center gap-1">
              <AudioLevelIndicator level={inputLevel} isActive={!isSpeaking} />
              <span className="text-xs text-muted-foreground">あなた</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <AudioLevelIndicator level={outputLevel} isActive={isSpeaking} />
              <span className="text-xs text-muted-foreground">AI</span>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        <div className="border rounded-lg bg-muted/30">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">トランスクリプト</span>
          </div>
          <ScrollArea className="h-40 sm:h-48">
            <div className="p-3 space-y-2">
              {transcript.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isConnected ? 'お話しください...' : '通話を開始してください'}
                </p>
              ) : (
                transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'agent'
                          ? 'bg-primary/10'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {msg.role === 'agent' ? 'エージェント' : 'あなた'}
                      </p>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4 pt-2">
          {!isConnected ? (
            <Button
              size="lg"
              className="gap-2 px-6 sm:px-8 h-12 sm:h-14 text-base touch-target"
              onClick={startConversation}
              disabled={isConnecting || isSaving}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  接続中...
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5" />
                  通話開始
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              className="gap-2 px-6 sm:px-8 h-12 sm:h-14 text-base touch-target"
              onClick={endConversation}
            >
              <PhoneOff className="h-5 w-5" />
              通話終了
            </Button>
          )}
        </div>

        {/* Microphone indicator */}
        {isConnected && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mic className="h-4 w-4 text-green-500" />
              マイクがオンです
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
