import { memo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Shield, UserX, Loader2 } from "lucide-react";

const roleColors: Record<string, string> = {
  owner: "bg-foreground/10 text-foreground",
  admin: "bg-amber-500/10 text-amber-500",
  member: "bg-muted text-muted-foreground",
};

const roleLabels: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

interface MemberCardProps {
  member: {
    id: string;
    user_id: string;
    role: "owner" | "admin" | "member";
    name: string;
    email: string;
    initials: string;
  };
  currentUserId: string | undefined;
  isAdmin: boolean;
  onUpdateRole: (params: { memberId: string; newRole: "admin" | "member" }) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
  isUpdating: boolean;
  isRemoving: boolean;
}

const MemberCardComponent = ({
  member,
  currentUserId,
  isAdmin,
  onUpdateRole,
  onRemove,
  isUpdating,
  isRemoving,
}: MemberCardProps) => {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  
  const canManage =
    isAdmin &&
    member.role !== "owner" &&
    member.user_id !== currentUserId;

  const handleRoleChange = async (newRole: "admin" | "member") => {
    await onUpdateRole({ memberId: member.id, newRole });
  };

  const handleRemove = async () => {
    await onRemove(member.id);
    setRemoveDialogOpen(false);
  };

  return (
    <>
      <div className="group rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-foreground/5 text-foreground">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              className={`${roleColors[member.role]} rounded-full px-3 py-1 text-xs font-normal border-0`}
            >
              {roleLabels[member.role]}
            </Badge>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isUpdating || isRemoving}
                  >
                    {isUpdating || isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleRoleChange(
                        member.role === "admin" ? "member" : "admin"
                      )
                    }
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {member.role === "admin"
                      ? "メンバーに変更"
                      : "管理者に昇格"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setRemoveDialogOpen(true)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>メンバーを削除</AlertDialogTitle>
            <AlertDialogDescription>
              {member.name} をワークスペースから削除しますか？
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const MemberCard = memo(MemberCardComponent);
