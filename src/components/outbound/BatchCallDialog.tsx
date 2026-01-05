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
import { Input } from '@/components/ui/input';
import { Users, Calendar, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOutboundCalls } from '@/hooks/useOutboundCalls';
import { useAgents } from '@/hooks/useAgents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BatchCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchCallDialog({ open, onOpenChange }: BatchCallDialogProps) {
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{ number: string; success: boolean; error?: string }[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { initiateCall } = useOutboundCalls();
  const { agents } = useAgents();

  const publishedAgents = agents.filter(a => a.status === 'published' && a.elevenlabs_agent_id);

  const parsePhoneNumbers = (text: string): string[] => {
    return text
      .split(/[\n,;]/)
      .map(line => line.replace(/[^\d+]/g, '').trim())
      .filter(num => num.length >= 10);
  };

  const parsedNumbers = parsePhoneNumbers(phoneNumbers);
  const validCount = parsedNumbers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agentId || validCount === 0) return;

    setIsSubmitting(true);
    setResults([]);
    setShowResults(true);

    let scheduledAt: string | undefined;
    if (isScheduled && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    const callResults: { number: string; success: boolean; error?: string }[] = [];

    for (const toNumber of parsedNumbers) {
      try {
        const result = await initiateCall({
          agentId,
          toNumber,
          scheduledAt,
          metadata: { batch: true },
        });
        
        callResults.push({
          number: toNumber,
          success: !!result,
          error: result ? undefined : '発信に失敗しました',
        });
      } catch (error) {
        callResults.push({
          number: toNumber,
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
        });
      }
      
      setResults([...callResults]);
    }

    setIsSubmitting(false);

    const successCount = callResults.filter(r => r.success).length;
    const failCount = callResults.length - successCount;

    if (failCount === 0) {
      toast.success(`${successCount}件の発信を開始しました`);
    } else {
      toast.warning(`${successCount}件成功、${failCount}件失敗`);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setPhoneNumbers('');
      setResults([]);
      setShowResults(false);
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            バッチコール
          </DialogTitle>
          <DialogDescription>
            複数の電話番号に一括で発信します
          </DialogDescription>
        </DialogHeader>

        {showResults ? (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    result.success
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-destructive/5 border-destructive/20"
                  )}
                >
                  <span className="font-mono text-sm">{result.number}</span>
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">{result.error}</span>
                    </div>
                  )}
                </div>
              ))}
              {isSubmitting && results.length < parsedNumbers.length && (
                <div className="flex items-center justify-center p-3">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    {results.length + 1} / {parsedNumbers.length} 処理中...
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose} disabled={isSubmitting}>
                閉じる
              </Button>
            </DialogFooter>
          </div>
        ) : (
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumbers">
                電話番号リスト
                {validCount > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({validCount}件検出)
                  </span>
                )}
              </Label>
              <Textarea
                id="phoneNumbers"
                placeholder={`+819012345678\n+819087654321\n+818011112222`}
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                1行に1番号、またはカンマ・セミコロンで区切って入力
              </p>
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
                onClick={handleClose}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={!agentId || validCount === 0}
              >
                {validCount > 0 ? `${validCount}件発信` : '発信する'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
