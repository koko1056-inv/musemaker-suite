import { useState } from "react";
import { Phone, RefreshCw, Bot, Tag, Unlink, Phone as PhoneIcon, MessageSquare, Settings, MoreVertical } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  // Empty state - no Twilio credentials
  if (!workspace?.twilio_account_sid || !workspace?.twilio_auth_token) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">電話番号</h1>
              <p className="text-sm text-muted-foreground">Twilioの電話番号を管理し、エージェントに割り当てます</p>
            </div>

            {/* Empty State Card */}
            <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-card/50 p-12 lg:p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-8">
                <Phone className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <h2 className="text-2xl font-medium mb-3">Twilio連携が必要です</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
                電話番号を管理するには、設定画面でTwilioの認証情報を設定してください。
              </p>
              <Button onClick={() => window.location.href = "/settings"} className="px-8">
                <Settings className="h-4 w-4 mr-2" />
                設定画面へ
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">電話番号</h1>
              <p className="text-sm text-muted-foreground">Twilioの電話番号を管理し、エージェントに割り当てます</p>
            </div>
            <Button 
              variant="outline" 
              onClick={syncFromTwilio} 
              disabled={isSyncing}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Twilioと同期
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : phoneNumbers.length === 0 ? (
            <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-card/50 p-12 lg:p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-8">
                <Phone className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <h2 className="text-2xl font-medium mb-3">電話番号がありません</h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                「Twilioと同期」をクリックして電話番号を取得してください
              </p>
            </div>
          ) : (
        <div className="space-y-4">
          {phoneNumbers.map((phone) => {
            const assignedAgent = agents.find(a => a.id === phone.agent_id);
            
            return (
              <div 
                key={phone.id} 
                className="group rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Left: Icon + Phone Info */}
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-foreground/50" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-mono font-medium tracking-wide mb-1">
                        {phone.phone_number}
                      </p>
                      {editingLabel === phone.phone_number_sid ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            className="h-9 w-48 text-sm rounded-xl"
                            placeholder="ラベルを入力"
                            autoFocus
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
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {phone.label || "ラベルを追加"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Center: Badges */}
                  <div className="flex items-center gap-3 lg:justify-center">
                    <div className="flex gap-2">
                      {phone.capabilities?.voice && (
                        <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-normal bg-foreground/5 hover:bg-foreground/10 border-0">
                          <PhoneIcon className="h-3 w-3 mr-1.5" />
                          音声
                        </Badge>
                      )}
                      {phone.capabilities?.sms && (
                        <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-normal bg-foreground/5 hover:bg-foreground/10 border-0">
                          <MessageSquare className="h-3 w-3 mr-1.5" />
                          SMS
                        </Badge>
                      )}
                    </div>
                    <Badge 
                      className={`rounded-full px-3 py-1.5 text-xs font-normal border-0 ${
                        phone.status === "active" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {phone.status === "active" ? "アクティブ" : phone.status}
                    </Badge>
                  </div>

                  {/* Right: Agent Assignment */}
                  <div className="flex items-center gap-3 lg:justify-end">
                    <Select
                      value={phone.agent_id || "none"}
                      onValueChange={(value) => handleAssign(phone.phone_number_sid, value)}
                    >
                      <SelectTrigger className="w-56 rounded-xl border-border/50 bg-background/50">
                        <SelectValue placeholder="エージェントを選択">
                          {assignedAgent ? (
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-muted-foreground" />
                              <span>{assignedAgent.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">未割り当て</span>
                          )}
                        </SelectValue>
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditLabel(phone)}>
                          <Tag className="h-4 w-4 mr-2" />
                          ラベルを編集
                        </DropdownMenuItem>
                        {phone.agent_id && (
                          <DropdownMenuItem 
                            onClick={() => unassignFromAgent(phone.phone_number_sid)}
                            className="text-destructive"
                          >
                            <Unlink className="h-4 w-4 mr-2" />
                            エージェント解除
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {phoneNumbers.length > 0 && (
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
            <div>
              <span className="text-foreground font-medium">{phoneNumbers.length}</span> 件の電話番号
            </div>
            <div>
              <span className="text-foreground font-medium">{phoneNumbers.filter(p => p.agent_id).length}</span> 件が割り当て済み
            </div>
            <div>
              <span className="text-foreground font-medium">{phoneNumbers.filter(p => p.status === "active").length}</span> 件がアクティブ
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </AppLayout>
  );
}