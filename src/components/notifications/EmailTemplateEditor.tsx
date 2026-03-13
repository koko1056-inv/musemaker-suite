import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Pencil,
  Check,
  X,
  Variable,
} from "lucide-react";
import { EmailNotification } from "@/hooks/useEmailNotifications";

interface ExtractionField {
  field_key: string;
  field_name: string;
}

interface EmailTemplateEditorProps {
  notification: EmailNotification;
  isEditing: boolean;
  editingTemplate: string;
  filteredExtractionFields: ExtractionField[];
  updateNotificationPending: boolean;
  onStartEdit: () => void;
  onTemplateChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function EmailTemplateEditor({
  notification,
  isEditing,
  editingTemplate,
  filteredExtractionFields,
  updateNotificationPending,
  onStartEdit,
  onTemplateChange,
  onSave,
  onCancel,
  onReset,
}: EmailTemplateEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          メッセージテンプレート
        </Label>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStartEdit}
            className="h-7 gap-1 text-xs"
          >
            <Pencil className="h-3 w-3" />
            編集
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editingTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
            placeholder="例: 📞 {{agent_name}}で通話がありました&#10;📱 電話番号: {{phone_number}}&#10;⏱ 通話時間: {{duration_formatted}}&#10;&#10;📝 要約:&#10;{{summary}}"
            className="min-h-[120px] font-mono text-sm"
          />
          <div className="bg-muted/50 p-3 rounded-md space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">標準変数:</p>
              <div className="flex flex-wrap gap-1.5">
                {["agent_name", "phone_number", "duration_formatted", "duration_seconds", "outcome", "summary", "transcript", "event_type", "timestamp"].map((v) => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="text-xs font-mono cursor-pointer hover:bg-primary/10"
                    onClick={() => onTemplateChange(editingTemplate + `{{${v}}}`)}
                  >
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
            {filteredExtractionFields.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Variable className="h-3.5 w-3.5 text-violet-500" />
                  <p className="text-xs text-muted-foreground">選択中のエージェントの抽出変数:</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filteredExtractionFields.map((field) => (
                    <Badge
                      key={field.field_key}
                      variant="outline"
                      className="text-xs font-mono cursor-pointer hover:bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300"
                      onClick={() => onTemplateChange(editingTemplate + `{{extracted.${field.field_key}}}`)}
                    >
                      <span className="opacity-50 mr-0.5">{field.field_name}:</span>
                      {`{{extracted.${field.field_key}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {filteredExtractionFields.length === 0 && (
              <div>
                <p className="text-xs text-muted-foreground">
                  抽出変数: 選択中のエージェントに抽出フィールドが設定されていません
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={updateNotificationPending}
              className="gap-1"
            >
              <Check className="h-4 w-4" />
              保存
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
            {notification.message_template && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-destructive hover:text-destructive ml-auto"
              >
                リセット
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {notification.message_template ? (
            <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-mono">
              {notification.message_template}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              デフォルトのメール形式を使用します。カスタマイズするには「編集」をクリック。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
