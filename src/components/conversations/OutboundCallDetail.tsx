import React from "react";
import { FileText, Lightbulb, Variable } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { ChatBubble } from "./ChatBubble";
import type { TranscriptMessage } from "./types";

interface ExtractedDataItem {
  field_key: string;
  field_value: string | null;
}

interface OutboundCallDetailProps {
  conversation: {
    summary?: string | null;
    key_points?: string[] | null;
    transcript?: TranscriptMessage[] | null;
    audio_url?: string | null;
    extracted_data?: ExtractedDataItem[] | null;
  };
  agentIconName: string;
  agentIconColor: string;
  extractionFieldNameMap?: Map<string, string>;
}

const OutboundCallDetailComponent = ({
  conversation,
  agentIconName,
  agentIconColor,
  extractionFieldNameMap,
}: OutboundCallDetailProps) => {
  const hasSummary = conversation.summary && conversation.summary.trim().length > 0;
  const hasKeyPoints = conversation.key_points && conversation.key_points.length > 0;
  const hasTranscript = conversation.transcript && conversation.transcript.length > 0;
  const hasExtractedData = conversation.extracted_data && conversation.extracted_data.length > 0;

  return (
    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
      {/* Summary */}
      {hasSummary && (
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">要約</p>
              <p className="text-sm leading-relaxed text-foreground">{conversation.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Points */}
      {hasKeyPoints && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">重要ポイント</span>
          </div>
          <ul className="space-y-1">
            {conversation.key_points!.map((point, i) => (
              <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Data */}
      {hasExtractedData && (
        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Variable className="h-3.5 w-3.5 text-violet-600" />
            <span className="text-xs font-medium text-violet-800 dark:text-violet-200">抽出データ</span>
          </div>
          <div className="space-y-1.5">
            {conversation.extracted_data!.map((item) => {
              const fieldName = extractionFieldNameMap?.get(item.field_key);
              return (
                <div key={item.field_key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-violet-700 dark:text-violet-300 text-xs">
                    {fieldName || item.field_key}
                  </span>
                  <span className="text-violet-900 dark:text-violet-100 font-medium truncate">
                    {item.field_value || '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {conversation.audio_url && (
        <div className="flex justify-center py-1">
          <AudioPlayer audioUrl={conversation.audio_url} />
        </div>
      )}

      {/* Chat Transcript */}
      {hasTranscript && (
        <div className="space-y-1.5 pt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">会話ログ</p>
          {conversation.transcript!.map((msg, i, arr) => {
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
};

export const OutboundCallDetail = React.memo(OutboundCallDetailComponent);
