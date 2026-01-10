import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSlackIntegrations } from "@/hooks/useSlackIntegrations";
import { useWorkspace } from "@/hooks/useWorkspace";

interface ShareCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: string;
  toNumber: string;
}

export function ShareCallDialog({
  open,
  onOpenChange,
  callId,
  toNumber,
}: ShareCallDialogProps) {
  const [activeTab, setActiveTab] = useState<"slack" | "email">("slack");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const { toast } = useToast();
  const { workspace } = useWorkspace();
  const { integrations } = useSlackIntegrations(workspace?.id);

  const activeIntegrations = integrations.filter((i) => i.is_active);

  const handleShare = async () => {
    if (activeTab === "slack" && !selectedWebhook) {
      toast({
        title: "エラー",
        description: "Slack連携を選択してください",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "email" && !email) {
      toast({
        title: "エラー",
        description: "メールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    if (activeTab === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "エラー",
        description: "有効なメールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const senderName = userData?.user?.user_metadata?.full_name || userData?.user?.email || "Musa AI";

      const { data, error } = await supabase.functions.invoke("share-call-content", {
        body: {
          callId,
          shareType: activeTab,
          webhookUrl: activeTab === "slack" ? selectedWebhook : undefined,
          recipientEmail: activeTab === "email" ? email : undefined,
          senderName,
        },
      });

      if (error) throw error;

      toast({
        title: "送信完了",
        description: activeTab === "slack" ? "Slackに送信しました" : "メールを送信しました",
      });

      onOpenChange(false);
      setEmail("");
      setSelectedWebhook(null);
    } catch (error: any) {
      console.error("Share error:", error);
      toast({
        title: "エラー",
        description: error.message || "送信に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>通話内容を共有</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          <span className="font-mono bg-muted px-2 py-0.5 rounded">{toNumber}</span> の通話記録を共有
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "slack" | "email")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slack" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Slack
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              メール
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slack" className="space-y-4 mt-4">
            {activeIntegrations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Slack連携が設定されていません</p>
                <p className="text-xs mt-1">設定 → 通知からSlack連携を追加してください</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>送信先を選択</Label>
                {activeIntegrations.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => setSelectedWebhook(integration.webhook_url)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedWebhook === integration.webhook_url
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-[#4A154B] flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{integration.name}</p>
                        {integration.channel_name && (
                          <p className="text-xs text-muted-foreground">#{integration.channel_name}</p>
                        )}
                      </div>
                    </div>
                    {selectedWebhook === integration.webhook_url && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">送信先メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleShare}
            disabled={isLoading || (activeTab === "slack" && activeIntegrations.length === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                {activeTab === "slack" ? <MessageSquare className="h-4 w-4 mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                送信
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
