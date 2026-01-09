import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  PhoneOff, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  X, 
  Calendar, 
  Loader2 
} from "lucide-react";

interface OutboundStatusBadgeProps {
  status: string;
  result?: string | null;
}

export const OutboundStatusBadge = memo(function OutboundStatusBadge({ status, result }: OutboundStatusBadgeProps) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs h-6">
          <Calendar className="h-3 w-3" />
          予約済み
        </Badge>
      );
    case 'initiating':
    case 'ringing':
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs h-6">
          <Loader2 className="h-3 w-3 animate-spin" />
          発信中
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 border-green-500/20 text-xs h-6">
          <Phone className="h-3 w-3" />
          通話中
        </Badge>
      );
    case 'completed':
      if (result === 'answered') {
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 border-green-500/20 text-xs h-6">
            <CheckCircle2 className="h-3 w-3" />
            完了
          </Badge>
        );
      } else if (result === 'busy') {
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs h-6">
            <PhoneOff className="h-3 w-3" />
            話し中
          </Badge>
        );
      } else if (result === 'no_answer') {
        return (
          <Badge variant="secondary" className="gap-1 font-normal bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs h-6">
            <Clock className="h-3 w-3" />
            応答なし
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs h-6">
          <CheckCircle2 className="h-3 w-3" />
          完了
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1 font-normal text-xs h-6">
          <XCircle className="h-3 w-3" />
          失敗
        </Badge>
      );
    case 'canceled':
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs h-6">
          <X className="h-3 w-3" />
          キャンセル
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="font-normal text-xs h-6">{status}</Badge>;
  }
});
