import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Columns, Plus, Trash2, ArrowUpDown, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ColumnMapping {
  key: string;
  header: string;
  enabled: boolean;
}

interface ColumnMappingEditorProps {
  integrationId: string;
  agentIds: string[] | null;
  currentMapping: Record<string, string> | null;
  onSave: (mapping: Record<string, string>) => void;
}

// 基本列（常に利用可能）
const BASE_COLUMNS: ColumnMapping[] = [
  { key: "_datetime", header: "日時", enabled: true },
  { key: "_agent_name", header: "エージェント名", enabled: true },
  { key: "_phone_number", header: "電話番号", enabled: true },
  { key: "_duration", header: "通話時間", enabled: true },
  { key: "_outcome", header: "結果", enabled: true },
  { key: "_status", header: "ステータス", enabled: true },
  { key: "_summary", header: "要約", enabled: true },
  { key: "_transcript", header: "トランスクリプト", enabled: true },
];

export function ColumnMappingEditor({
  integrationId,
  agentIds,
  currentMapping,
  onSave,
}: ColumnMappingEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnMapping[]>([]);
  const [extractionFields, setExtractionFields] = useState<ColumnMapping[]>([]);

  // エージェントの抽出フィールドを取得
  const { data: allExtractionFields = [] } = useQuery({
    queryKey: ["all-extraction-fields", agentIds],
    queryFn: async () => {
      if (!agentIds || agentIds.length === 0) {
        // 全エージェントの抽出フィールドを取得
        const { data, error } = await supabase
          .from("agent_extraction_fields")
          .select("field_key, field_name, agent_id")
          .order("field_name");

        if (error) throw error;
        return data || [];
      }

      // 指定されたエージェントの抽出フィールドを取得
      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agentIds)
        .order("field_name");

      if (error) throw error;
      return data || [];
    },
  });

  // ダイアログを開いた時に状態を初期化
  useEffect(() => {
    if (isOpen) {
      // 基本列の初期化
      const baseColumnsWithState = BASE_COLUMNS.map((col) => ({
        ...col,
        header: currentMapping?.[col.key] || col.header,
        enabled: currentMapping ? col.key in currentMapping : true,
      }));
      setColumns(baseColumnsWithState);

      // 抽出フィールドをユニークにして初期化
      const uniqueFields = new Map<string, string>();
      allExtractionFields.forEach((field) => {
        if (!uniqueFields.has(field.field_key)) {
          uniqueFields.set(field.field_key, field.field_name);
        }
      });

      const extractionColumnsWithState = Array.from(uniqueFields.entries()).map(
        ([key, name]) => ({
          key: `extract_${key}`,
          header: currentMapping?.[`extract_${key}`] || name,
          enabled: currentMapping ? `extract_${key}` in currentMapping : true,
        })
      );
      setExtractionFields(extractionColumnsWithState);
    }
  }, [isOpen, currentMapping, allExtractionFields]);

  const toggleColumn = (key: string, isExtraction: boolean) => {
    if (isExtraction) {
      setExtractionFields((prev) =>
        prev.map((col) =>
          col.key === key ? { ...col, enabled: !col.enabled } : col
        )
      );
    } else {
      setColumns((prev) =>
        prev.map((col) =>
          col.key === key ? { ...col, enabled: !col.enabled } : col
        )
      );
    }
  };

  const updateHeader = (key: string, header: string, isExtraction: boolean) => {
    if (isExtraction) {
      setExtractionFields((prev) =>
        prev.map((col) => (col.key === key ? { ...col, header } : col))
      );
    } else {
      setColumns((prev) =>
        prev.map((col) => (col.key === key ? { ...col, header } : col))
      );
    }
  };

  const handleSave = () => {
    const mapping: Record<string, string> = {};

    // 基本列
    columns.forEach((col) => {
      if (col.enabled) {
        mapping[col.key] = col.header;
      }
    });

    // 抽出フィールド列
    extractionFields.forEach((col) => {
      if (col.enabled) {
        mapping[col.key] = col.header;
      }
    });

    onSave(mapping);
    setIsOpen(false);
  };

  const enabledCount =
    columns.filter((c) => c.enabled).length +
    extractionFields.filter((c) => c.enabled).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns className="h-3.5 w-3.5" />
          カラム設定
          <Badge variant="secondary" className="ml-1">
            {enabledCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns className="h-5 w-5" />
            出力カラム設定
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          スプレッドシートに出力する列とヘッダー名を設定します。
          抽出データは個別の列として出力されます。
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* 基本列 */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                基本項目
              </h4>
              <div className="space-y-2">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <Switch
                      checked={col.enabled}
                      onCheckedChange={() => toggleColumn(col.key, false)}
                    />
                    <Input
                      value={col.header}
                      onChange={(e) =>
                        updateHeader(col.key, e.target.value, false)
                      }
                      placeholder="ヘッダー名"
                      className="flex-1 h-8"
                      disabled={!col.enabled}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 抽出フィールド列 */}
            {extractionFields.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  抽出データ（個別列）
                </h4>
                <p className="text-xs text-muted-foreground">
                  各抽出フィールドが独立した列として出力されます
                </p>
                <div className="space-y-2">
                  {extractionFields.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <Switch
                        checked={col.enabled}
                        onCheckedChange={() => toggleColumn(col.key, true)}
                      />
                      <Input
                        value={col.header}
                        onChange={(e) =>
                          updateHeader(col.key, e.target.value, true)
                        }
                        placeholder="ヘッダー名"
                        className="flex-1 h-8"
                        disabled={!col.enabled}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractionFields.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                抽出フィールドがありません。
                <br />
                エージェントに抽出フィールドを設定すると、ここに表示されます。
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-1.5" />
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
