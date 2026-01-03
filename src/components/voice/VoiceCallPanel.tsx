import { useState } from 'react';
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

export function VoiceCallPanel({ 
  agentId, 
  elevenLabsAgentId, 
  agentName,
  onCallEnd 
}: VoiceCallPanelProps) {
  const {
    isConnecting,
    isSaving,
    isConnected,
    isSpeaking,
    transcript,
    startConversation,
    endConversation,
  } = useVoiceConversation({
    agentId,
    elevenLabsAgentId,
    onConversationEnd: () => {
      onCallEnd?.();
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Phone className="h-5 w-5" />
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
      
      <CardContent className="space-y-4">
        {/* Transcript Display */}
        <div className="border rounded-lg bg-muted/30">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">トランスクリプト</span>
          </div>
          <ScrollArea className="h-48">
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
        <div className="flex justify-center gap-4">
          {!isConnected ? (
            <Button
              size="lg"
              className="gap-2 px-8"
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
              className="gap-2 px-8"
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
