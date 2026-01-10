import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import {
  InviteMemberDialog,
  MemberCard,
  PendingInvitationsList,
} from "@/components/team";

const roleColors: Record<string, string> = {
  owner: "bg-foreground/10 text-foreground",
  admin: "bg-amber-500/10 text-amber-500",
  member: "bg-muted text-muted-foreground",
};

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { user } = useAuth();

  const {
    members,
    invitations,
    isLoading,
    invite,
    isInviting,
    updateRole,
    isUpdatingRole,
    removeMember,
    isRemovingMember,
    cancelInvitation,
    isCancellingInvitation,
    isAdmin,
  } = useWorkspaceMembers();

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                チーム
              </h1>
              <p className="text-sm text-muted-foreground">
                ワークスペースのメンバーと権限を管理
              </p>
            </div>
            {isAdmin && (
              <Button
                className="shrink-0"
                onClick={() => setInviteDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                メンバーを招待
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="メンバーを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-xl border-border/50"
              />
            </div>
          </div>

          {/* Pending Invitations */}
          {isAdmin && (
            <PendingInvitationsList
              invitations={invitations}
              onCancel={cancelInvitation}
              isCancelling={isCancellingInvitation}
            />
          )}

          {/* Members List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-card/50 p-12 lg:p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-8">
                <Users className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <h2 className="text-2xl font-medium mb-3">メンバーがいません</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
                チームメンバーを招待して、一緒にワークスペースを管理しましょう。
              </p>
              {isAdmin && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  メンバーを招待
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  onUpdateRole={updateRole}
                  onRemove={removeMember}
                  isUpdating={isUpdatingRole}
                  isRemoving={isRemovingMember}
                />
              ))}
            </div>
          )}

          {/* Stats Footer */}
          {members.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
                <div>
                  <span className="text-foreground font-medium">
                    {members.length}
                  </span>{" "}
                  人のメンバー
                </div>
                <div>
                  <span className="text-foreground font-medium">
                    {
                      members.filter(
                        (m) => m.role === "admin" || m.role === "owner"
                      ).length
                    }
                  </span>{" "}
                  人の管理者
                </div>
                {invitations.length > 0 && (
                  <div>
                    <span className="text-foreground font-medium">
                      {invitations.length}
                    </span>{" "}
                    件の保留中の招待
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Permissions Info */}
          <div className="mt-12 rounded-2xl border border-border/50 bg-card/30 p-8">
            <h3 className="font-medium text-lg text-foreground mb-6">
              役割の権限
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <Badge
                  className={`${roleColors.owner} rounded-full px-3 py-1 text-xs font-normal border-0`}
                >
                  オーナー
                </Badge>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• ワークスペースへの完全なアクセス</li>
                  <li>• 請求とサブスクリプションの管理</li>
                  <li>• ワークスペースの削除</li>
                </ul>
              </div>
              <div className="space-y-3">
                <Badge
                  className={`${roleColors.admin} rounded-full px-3 py-1 text-xs font-normal border-0`}
                >
                  管理者
                </Badge>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• チームメンバーの管理</li>
                  <li>• 連携機能の設定</li>
                  <li>• エージェントの公開</li>
                </ul>
              </div>
              <div className="space-y-3">
                <Badge
                  className={`${roleColors.member} rounded-full px-3 py-1 text-xs font-normal border-0`}
                >
                  メンバー
                </Badge>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• エージェントの作成と編集</li>
                  <li>• 分析の閲覧</li>
                  <li>• 会話へのアクセス</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={invite}
        isInviting={isInviting}
      />
    </AppLayout>
  );
}
