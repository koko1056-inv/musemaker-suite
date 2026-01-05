import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Phone, Plus } from 'lucide-react';
import { OutboundCallDialog } from '@/components/outbound/OutboundCallDialog';
import { OutboundCallList } from '@/components/outbound/OutboundCallList';

export default function OutboundCalls() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                アウトバウンドコール
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                エージェントからの発信を管理
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            新規発信
          </Button>
        </div>

        {/* Call List */}
        <OutboundCallList />

        {/* Dialog */}
        <OutboundCallDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
