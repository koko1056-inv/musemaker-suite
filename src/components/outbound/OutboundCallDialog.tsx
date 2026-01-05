import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, Calendar, Loader2 } from 'lucide-react';
import { useOutboundCalls } from '@/hooks/useOutboundCalls';
import { useAgents } from '@/hooks/useAgents';

interface OutboundCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAgentId?: string;
}

export function OutboundCallDialog({ 
  open, 
  onOpenChange,
  defaultAgentId 
}: OutboundCallDialogProps) {
  const [toNumber, setToNumber] = useState('');
  const [agentId, setAgentId] = useState(defaultAgentId || '');
  const [notes, setNotes] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const { initiateCall, isInitiating } = useOutboundCalls();
  const { agents } = useAgents();

  const publishedAgents = agents.filter(a => a.status === 'published' && a.elevenlabs_agent_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toNumber || !agentId) return;

    let scheduledAt: string | undefined;
    if (isScheduled && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    const result = await initiateCall({
      agentId,
      toNumber,
      scheduledAt,
      metadata: notes ? { notes } : undefined,
    });

    if (result) {
      onOpenChange(false);
      setToNumber('');
      setNotes('');
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            アウトバウンドコール
          </DialogTitle>
          <DialogDescription>
            エージェントから顧客へ発信します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent">エージェント</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="エージェントを選択" />
              </SelectTrigger>
              <SelectContent>
                {publishedAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {publishedAgents.length === 0 && (
              <p className="text-xs text-muted-foreground">
                公開済みで通話可能なエージェントがありません
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toNumber">発信先電話番号</Label>
            <Input
              id="toNumber"
              type="tel"
              placeholder="+819012345678"
              value={toNumber}
              onChange={(e) => setToNumber(formatPhoneNumber(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              国際形式で入力してください（例: +819012345678）
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">メモ（任意）</Label>
            <Textarea
              id="notes"
              placeholder="コールに関するメモを入力..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">スケジュール発信</p>
                <p className="text-xs text-muted-foreground">指定した日時に発信</p>
              </div>
            </div>
            <Switch
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
            />
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">日付</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required={isScheduled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">時刻</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required={isScheduled}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!toNumber || !agentId || isInitiating}
            >
              {isInitiating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  発信中...
                </>
              ) : isScheduled ? (
                'スケジュール'
              ) : (
                '発信する'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
