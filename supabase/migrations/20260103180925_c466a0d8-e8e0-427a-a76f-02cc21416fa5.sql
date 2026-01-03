-- Create webhooks configuration table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'conversation_ended',
  is_active BOOLEAN NOT NULL DEFAULT true,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Workspace members can view webhooks"
ON public.webhooks FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can manage webhooks"
ON public.webhooks FOR ALL
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Create webhook logs table
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook logs
CREATE POLICY "Workspace members can view webhook logs"
ON public.webhook_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks w
    WHERE w.id = webhook_id
    AND public.is_workspace_member(auth.uid(), w.workspace_id)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();