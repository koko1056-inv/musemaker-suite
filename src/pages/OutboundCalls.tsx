import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Phone, Plus, Users } from 'lucide-react';
import { OutboundCallDialog } from '@/components/outbound/OutboundCallDialog';
import { OutboundCallList } from '@/components/outbound/OutboundCallList';
import { BatchCallDialog } from '@/components/outbound/BatchCallDialog';

export default function OutboundCalls() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5">
              <Phone className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                発信
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                エージェントからの発信を管理
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="gap-2 h-11 px-5 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            新規発信
          </Button>
          <Button 
            onClick={() => setBatchDialogOpen(true)} 
            variant="secondary"
            className="gap-2 h-11 px-5 rounded-xl"
          >
            <Users className="h-4 w-4" />
            一括発信
          </Button>
        </div>

        {/* Call List */}
        <OutboundCallList />

        {/* Dialogs */}
        <OutboundCallDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
        <BatchCallDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
