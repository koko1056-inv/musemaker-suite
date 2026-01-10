import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Loader2, Copy, Check, Link, MessageCircle, Hash, Share2 } from "lucide-react";
import { toast } from "sonner";

interface InviteResult {
  id: string;
  token: string;
  emailSent: boolean;
}

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (params: { email: string; role: "admin" | "member" }) => Promise<InviteResult>;
  isInviting: boolean;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  isInviting,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const result = await onInvite({ email, role });
      
      if (!result.emailSent) {
        // Email couldn't be sent, show the invite link
        const appUrl = window.location.origin;
        const link = `${appUrl}/invite/accept?token=${result.token}`;
        setInviteLink(link);
        toast.info("招待リンクを作成しました。リンクをコピーして共有してください。");
      } else {
        // Email was sent successfully, close dialog
        setEmail("");
        setRole("member");
        setInviteLink(null);
        onOpenChange(false);
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("リンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const handleShareLine = () => {
    if (!inviteLink) return;
    const message = encodeURIComponent(`ワークスペースへの招待\n${inviteLink}`);
    window.open(`https://line.me/R/share?text=${message}`, "_blank");
  };

  const handleShareSlack = () => {
    if (!inviteLink) return;
    // Slack doesn't have a direct share URL, but we can copy a formatted message
    const message = `ワークスペースへの招待リンク: ${inviteLink}`;
    navigator.clipboard.writeText(message).then(() => {
      toast.success("Slack用メッセージをコピーしました");
    });
  };

  const handleNativeShare = async () => {
    if (!inviteLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ワークスペースへの招待",
          text: "ワークスペースに参加してください",
          url: inviteLink,
        });
      } catch (e) {
        // User cancelled or share failed
        console.log("Share cancelled");
      }
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setEmail("");
      setRole("member");
      setInviteLink(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>チームメンバーを招待</DialogTitle>
          <DialogDescription>
            ワークスペースへの招待を送信します
          </DialogDescription>
        </DialogHeader>
        
        {inviteLink ? (
          <div className="space-y-4 pt-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Link className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    招待リンクを共有してください
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    メール送信ができないため、以下のリンクを直接共有してください
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>招待リンク</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="rounded-xl text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                このリンクは7日間有効です
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>共有する</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleShareLine}
                >
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  LINE
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleShareSlack}
                >
                  <Hash className="h-4 w-4 text-purple-500" />
                  Slack
                </Button>
                {typeof navigator !== "undefined" && navigator.share && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNativeShare}
                    className="shrink-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleClose(false)}
            >
              閉じる
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">メールアドレス</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="rounded-xl"
                required
                disabled={isInviting}
              />
            </div>
            <div className="space-y-2">
              <Label>役割</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "admin" | "member")}
                disabled={isInviting}
              >
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
            <Button type="submit" className="w-full" disabled={isInviting}>
              {isInviting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              招待を送信
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
