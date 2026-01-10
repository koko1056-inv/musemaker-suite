import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  admin: "管理者",
  member: "メンバー",
};

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  expires_at: string;
  created_at: string;
}

interface PendingInvitationsListProps {
  invitations: Invitation[];
  onCancel: (id: string) => Promise<void>;
  isCancelling: boolean;
}

const PendingInvitationsListComponent = ({
  invitations,
  onCancel,
  isCancelling,
}: PendingInvitationsListProps) => {
  if (invitations.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        保留中の招待 ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="rounded-xl border border-dashed border-border/50 bg-card/30 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
                {invitation.email.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {invitation.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(invitation.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                  に招待
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-normal"
              >
                {roleLabels[invitation.role] || invitation.role}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onCancel(invitation.id)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PendingInvitationsList = memo(PendingInvitationsListComponent);
