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
    name: "John Doe",
    email: "john@acme.com",
    role: "owner",
    status: "active",
    initials: "JD",
    joinedAt: "Dec 2023",
  },
  {
    id: "2",
    name: "Sarah Smith",
    email: "sarah@acme.com",
    role: "admin",
    status: "active",
    initials: "SS",
    joinedAt: "Jan 2024",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@acme.com",
    role: "member",
    status: "active",
    initials: "MJ",
    joinedAt: "Jan 2024",
  },
  {
    id: "4",
    name: "Emily Brown",
    email: "emily@acme.com",
    role: "member",
    status: "pending",
    initials: "EB",
    joinedAt: "Pending",
  },
];

const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-yellow-500/10 text-yellow-500",
  member: "bg-muted text-muted-foreground",
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
            <h1 className="text-3xl font-bold text-foreground">Team</h1>
            <p className="mt-1 text-muted-foreground">
              Manage workspace members and permissions
            </p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your workspace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="colleague@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select defaultValue="member">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Admins can manage team members and settings
                  </p>
                </div>
                <Button className="w-full" onClick={() => setInviteDialogOpen(false)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
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
              placeholder="Search members..."
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
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={roleColors[member.role]} variant="secondary">
                    {member.role}
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
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <UserX className="mr-2 h-4 w-4" />
                          Remove
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
          <h3 className="font-semibold text-foreground mb-4">Role Permissions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={roleColors.owner} variant="secondary">Owner</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full workspace access</li>
                <li>• Manage billing & subscription</li>
                <li>• Delete workspace</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={roleColors.admin} variant="secondary">Admin</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Manage team members</li>
                <li>• Configure integrations</li>
                <li>• Publish agents</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={roleColors.member} variant="secondary">Member</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create & edit agents</li>
                <li>• View analytics</li>
                <li>• Access conversations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
