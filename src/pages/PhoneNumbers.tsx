import { useState } from "react";
import { Phone, RefreshCw, Bot, Tag, Unlink, Phone as PhoneIcon, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">電話番号管理</h1>
          <p className="text-muted-foreground">Twilioの電話番号を管理し、エージェントに割り当てます</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Twilio連携が必要です
            </CardTitle>
            <CardDescription>
              電話番号を管理するには、設定画面でTwilioの認証情報を設定してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.href = "/settings"}>
              設定画面へ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">電話番号管理</h1>
          <p className="text-muted-foreground">Twilioの電話番号を管理し、エージェントに割り当てます</p>
        </div>
        <Button onClick={syncFromTwilio} disabled={isSyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          Twilioと同期
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            電話番号一覧
          </CardTitle>
          <CardDescription>
            Twilioアカウントに登録されている電話番号とエージェントへの割り当て状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : phoneNumbers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>電話番号が見つかりません</p>
              <p className="text-sm">「Twilioと同期」をクリックして電話番号を取得してください</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>電話番号</TableHead>
                  <TableHead>ラベル</TableHead>
                  <TableHead>機能</TableHead>
                  <TableHead>割り当てエージェント</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell className="font-mono font-medium">
                      {phone.phone_number}
                    </TableCell>
                    <TableCell>
                      {editingLabel === phone.phone_number_sid ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            className="h-8 w-40"
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
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Tag className="h-3 w-3" />
                          {phone.label || "ラベルなし"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {phone.capabilities?.voice && (
                          <Badge variant="outline" className="text-xs">
                            <PhoneIcon className="h-3 w-3 mr-1" />
                            音声
                          </Badge>
                        )}
                        {phone.capabilities?.sms && (
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            SMS
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={phone.agent_id || "none"}
                        onValueChange={(value) => handleAssign(phone.phone_number_sid, value)}
                      >
                        <SelectTrigger className="w-48">
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
                    </TableCell>
                    <TableCell>
                      <Badge variant={phone.status === "active" ? "default" : "secondary"}>
                        {phone.status === "active" ? "アクティブ" : phone.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {phone.agent_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unassignFromAgent(phone.phone_number_sid)}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          解除
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
