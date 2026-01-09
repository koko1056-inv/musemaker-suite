import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Edit, Trash2, ExternalLink } from "lucide-react";
import { KnowledgeItem } from "@/hooks/useKnowledgeBase";

const CATEGORIES = [
  { value: "faq", label: "FAQ" },
  { value: "product", label: "製品情報" },
  { value: "policy", label: "ポリシー" },
  { value: "guide", label: "ガイド" },
  { value: "other", label: "その他" },
];

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (item: KnowledgeItem) => void;
}

export function KnowledgeItemCard({ item, onEdit, onDelete }: KnowledgeItemCardProps) {
  const handlePreview = () => {
    if (item.file_url) {
      window.open(item.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileExtension = (fileType: string | null): string => {
    if (!fileType) return 'ファイル';
    const ext = fileType.split('/').pop();
    return ext?.toUpperCase() || 'ファイル';
  };

  return (
    <div className="glass rounded-xl p-4 card-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.file_url ? (
            <Upload className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <h4 className="font-medium text-sm truncate">{item.title}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {item.file_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePreview}
              title="プレビュー"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
      
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {item.file_type && (
          <Badge variant="outline" className="text-xs">
            {getFileExtension(item.file_type)}
          </Badge>
        )}
        {item.category && (
          <Badge variant="secondary" className="text-xs">
            {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
          </Badge>
        )}
      </div>
    </div>
  );
}
