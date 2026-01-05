import { useState } from "react";
import { Phone, RefreshCw, Bot, Tag, Unlink, Phone as PhoneIcon, MessageSquare, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { useAgents } from "@/hooks/useAgents";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function PhoneNumbers() {
  const { workspace } = useWorkspace();
  const { phoneNumbers, isLoading, isSyncing, syncFromTwilio, assignToAgent, unassignFromAgent, updateLabel } = usePhoneNumbers(workspace?.id);
  const { agents } = useAgents();
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState("");

  const handleAssign = async (phoneNumberSid: string, agentId: string) => {
    if (agentId === "none") {
      await unassignFromAgent(phoneNumberSid);
    } else {
      await assignToAgent(phoneNumberSid, agentId);
    }
  };

  const handleLabelSave = async (phoneNumberSid: string) => {
    await updateLabel(phoneNumberSid, labelValue);
    setEditingLabel(null);
  };

  const startEditLabel = (phoneNumber: any) => {
    setEditingLabel(phoneNumber.phone_number_sid);
    setLabelValue(phoneNumber.label || "");
  };

  if (!workspace?.twilio_account_sid || !workspace?.twilio_auth_token) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-serif font-medium tracking-tight">電話番号</h1>
          <p className="text-muted-foreground mt-2">Twilioの電話番号を管理し、エージェントに割り当てます</p>
        </div>

        {/* Empty State */}
        <Card className="border-0 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-medium mb-2">Twilio連携が必要です</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              電話番号を管理するには、設定画面でTwilioの認証情報を設定してください。
            </p>
            <Button variant="elegant" onClick={() => window.location.href = "/settings"}>
              <Settings className="h-4 w-4 mr-2" />
              設定画面へ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-medium tracking-tight">電話番号</h1>
          <p className="text-muted-foreground mt-2">Twilioの電話番号を管理し、エージェントに割り当てます</p>
        </div>
        <Button variant="elegant" onClick={syncFromTwilio} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          Twilioと同期
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : phoneNumbers.length === 0 ? (
        <Card className="border-0 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-medium mb-2">電話番号がありません</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              「Twilioと同期」をクリックして電話番号を取得してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {phoneNumbers.map((phone) => (
            <Card key={phone.id} className="border-0 bg-card/50 hover:bg-card/80 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left: Phone number and label */}
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-foreground/60" />
                    </div>
                    <div>
                      <p className="text-lg font-mono font-medium tracking-wide">
                        {phone.phone_number}
                      </p>
                      {editingLabel === phone.phone_number_sid ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            className="h-8 w-40 text-sm"
                            placeholder="ラベルを入力"
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleLabelSave(phone.phone_number_sid)}>
                            保存
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingLabel(null)}>
                            キャンセル
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditLabel(phone)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
                        >
                          <Tag className="h-3 w-3" />
                          {phone.label || "ラベルを追加"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Center: Capabilities and Status */}
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {phone.capabilities?.voice && (
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-normal border-foreground/10">
                          <PhoneIcon className="h-3 w-3 mr-1.5" />
                          音声
                        </Badge>
                      )}
                      {phone.capabilities?.sms && (
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-normal border-foreground/10">
                          <MessageSquare className="h-3 w-3 mr-1.5" />
                          SMS
                        </Badge>
                      )}
                    </div>
                    <Badge 
                      variant={phone.status === "active" ? "default" : "secondary"}
                      className="rounded-full px-3 py-1 text-xs font-normal"
                    >
                      {phone.status === "active" ? "アクティブ" : phone.status}
                    </Badge>
                  </div>

                  {/* Right: Agent assignment */}
                  <div className="flex items-center gap-3">
                    <Select
                      value={phone.agent_id || "none"}
                      onValueChange={(value) => handleAssign(phone.phone_number_sid, value)}
                    >
                      <SelectTrigger className="w-52 rounded-xl border-foreground/10">
                        <SelectValue placeholder="エージェントを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">未割り当て</span>
                        </SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              {agent.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {phone.agent_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unassignFromAgent(phone.phone_number_sid)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}