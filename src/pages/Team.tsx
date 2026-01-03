import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Plus, MoreVertical, Mail, Shield, UserX, Search } from "lucide-react";

const members = [
  {
    id: "1",
    name: "山田 太郎",
    email: "yamada@example.com",
    role: "owner",
    status: "active",
    initials: "山田",
    joinedAt: "2023年12月",
  },
  {
    id: "2",
    name: "佐藤 花子",
    email: "sato@example.com",
    role: "admin",
    status: "active",
    initials: "佐藤",
    joinedAt: "2024年1月",
  },
  {
    id: "3",
    name: "鈴木 一郎",
    email: "suzuki@example.com",
    role: "member",
    status: "active",
    initials: "鈴木",
    joinedAt: "2024年1月",
  },
  {
    id: "4",
    name: "田中 美咲",
    email: "tanaka@example.com",
    role: "member",
    status: "pending",
    initials: "田中",
    joinedAt: "保留中",
  },
];

const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-yellow-500/10 text-yellow-500",
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

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">チーム</h1>
            <p className="mt-1 text-muted-foreground">
              ワークスペースのメンバーと権限を管理
            </p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                メンバーを招待
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>チームメンバーを招待</DialogTitle>
                <DialogDescription>
                  ワークスペースへの招待を送信
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input id="email" type="email" placeholder="colleague@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>役割</Label>
                  <Select defaultValue="member">
                    <SelectTrigger>
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
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="メンバーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Members List */}
        <div className="glass rounded-xl card-shadow overflow-hidden">
          <div className="divide-y divide-border/50">
            {filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{member.name}</p>
                      {member.status === "pending" && (
                        <Badge variant="outline" className="text-xs">
                          保留中
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={roleColors[member.role]} variant="secondary">
                    {roleLabels[member.role]}
                  </Badge>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {member.joinedAt}
                  </span>
                  
                  {member.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
            ))}
          </div>
        </div>

        {/* Permissions Info */}
        <div className="mt-8 glass rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-foreground mb-4">役割の権限</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={roleColors.owner} variant="secondary">オーナー</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• ワークスペースへの完全なアクセス</li>
                <li>• 請求とサブスクリプションの管理</li>
                <li>• ワークスペースの削除</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={roleColors.admin} variant="secondary">管理者</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• チームメンバーの管理</li>
                <li>• 連携機能の設定</li>
                <li>• エージェントの公開</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={roleColors.member} variant="secondary">メンバー</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• エージェントの作成と編集</li>
                <li>• 分析の閲覧</li>
                <li>• 会話へのアクセス</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
