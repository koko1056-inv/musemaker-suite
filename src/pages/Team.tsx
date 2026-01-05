import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MoreVertical, Mail, Shield, UserX, Search, Users } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { workspace } = useWorkspace();
  const { user } = useAuth();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["workspace-members", workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      
      const { data: workspaceMembers, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspace.id);

      if (error) throw error;

      // Fetch profiles for each member
      const memberIds = workspaceMembers.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds);

      return workspaceMembers.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        return {
          ...member,
          name: profile?.full_name || profile?.email?.split("@")[0] || "Unknown",
          email: profile?.email || "",
          initials: (profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase(),
        };
      });
    },
    enabled: !!workspace?.id,
  });

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl lg:text-5xl font-serif font-medium tracking-tight mb-3">チーム</h1>
          <p className="text-lg text-muted-foreground">ワークスペースのメンバーと権限を管理</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              メンバーを招待
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">チームメンバーを招待</DialogTitle>
              <DialogDescription>
                ワークスペースへの招待を送信
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" placeholder="colleague@company.com" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>役割</Label>
                <Select defaultValue="member">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="member">メンバー</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  管理者はチームメンバーと設定を管理できます
                </p>
              </div>
              <Button className="w-full" onClick={() => setInviteDialogOpen(false)}>
                <Mail className="mr-2 h-4 w-4" />
                招待を送信
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <h2 className="text-2xl font-serif font-medium mb-3">メンバーがいません</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            チームメンバーを招待して、一緒にワークスペースを管理しましょう。
          </p>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            メンバーを招待
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="group rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-foreground/5 text-foreground font-serif">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={`${roleColors[member.role]} rounded-full px-3 py-1 text-xs font-normal border-0`}>
                    {roleLabels[member.role]}
                  </Badge>
                  
                  {member.role !== "owner" && member.user_id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          役割を変更
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <UserX className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {members.length > 0 && (
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
            <div>
              <span className="text-foreground font-medium">{members.length}</span> 人のメンバー
            </div>
            <div>
              <span className="text-foreground font-medium">{members.filter(m => m.role === "admin" || m.role === "owner").length}</span> 人の管理者
            </div>
          </div>
        </div>
      )}

      {/* Permissions Info */}
      <div className="mt-12 rounded-2xl border border-border/50 bg-card/30 p-8">
        <h3 className="font-serif font-medium text-lg text-foreground mb-6">役割の権限</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <Badge className={`${roleColors.owner} rounded-full px-3 py-1 text-xs font-normal border-0`}>
              オーナー
            </Badge>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• ワークスペースへの完全なアクセス</li>
              <li>• 請求とサブスクリプションの管理</li>
              <li>• ワークスペースの削除</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Badge className={`${roleColors.admin} rounded-full px-3 py-1 text-xs font-normal border-0`}>
              管理者
            </Badge>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• チームメンバーの管理</li>
              <li>• 連携機能の設定</li>
              <li>• エージェントの公開</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Badge className={`${roleColors.member} rounded-full px-3 py-1 text-xs font-normal border-0`}>
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
  );
}