import { memo } from "react";
import { FileText, Lightbulb, CheckCircle, Variable } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { ChatBubble } from "./ChatBubble";
import type { ConversationDisplay } from "./types";

interface ConversationDetailProps {
  conversation: ConversationDisplay;
  agentIconName: string;
  agentIconColor: string;
}

export const ConversationDetail = memo(function ConversationDetail({
  conversation,
  agentIconName,
  agentIconColor,
}: ConversationDetailProps) {
  const hasTranscript = conversation.transcript && conversation.transcript.length > 0;
  const hasSummary = conversation.summary && conversation.summary.trim().length > 0;
  const hasKeyPoints = conversation.keyPoints && conversation.keyPoints.length > 0;
  const hasActionItems = conversation.actionItems && conversation.actionItems.length > 0;
  const hasExtractedData = conversation.extractedData && conversation.extractedData.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {hasSummary && (
        <div className="bg-muted/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">AI要約</p>
              <p className="text-sm leading-relaxed">{conversation.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Points & Action Items */}
      {(hasKeyPoints || hasActionItems) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {hasKeyPoints && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">重要ポイント</span>
              </div>
              <ul className="space-y-1.5">
                {conversation.keyPoints.map((point, i) => (
                  <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {hasActionItems && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">アクション</span>
              </div>
              <ul className="space-y-1.5">
                {conversation.actionItems.map((item, i) => (
                  <li key={i} className="text-sm text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">□</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Extracted Data */}
      {hasExtractedData && (
        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Variable className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-800 dark:text-violet-200">抽出データ</span>
          </div>
          <div className="grid gap-2">
            {conversation.extractedData.map((item) => (
              <div key={item.field_key} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex flex-col gap-0.5">
                  {item.field_name && (
                    <span className="text-violet-800 dark:text-violet-200 text-xs font-medium">
                      {item.field_name}
                    </span>
                  )}
                  <span className="text-violet-600 dark:text-violet-400 font-mono text-xs bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded inline-block w-fit">
                    {item.field_key}
                  </span>
                </div>
                <span className="text-violet-900 dark:text-violet-100 text-right flex-1 truncate font-medium">
                  {item.field_value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {conversation.audioUrl && (
        <div className="flex justify-center">
          <AudioPlayer audioUrl={conversation.audioUrl} />
        </div>
      )}

      {/* Chat Transcript */}
      {hasTranscript && (
        <div className="space-y-2">
          {conversation.transcript.map((msg, i, arr) => {
            const prevMsg = arr[i - 1];
            const showAvatar = !prevMsg || prevMsg.role !== msg.role;
            
            return (
              <ChatBubble
                key={i}
                message={msg}
                isAgent={msg.role === 'agent'}
                agentIcon={agentIconName}
                agentColor={agentIconColor}
                showAvatar={showAvatar}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
