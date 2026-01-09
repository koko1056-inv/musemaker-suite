-- Slack通知設定テーブルを作成
CREATE TABLE public.slack_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  channel_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_on_call_start BOOLEAN NOT NULL DEFAULT false,
  notify_on_call_end BOOLEAN NOT NULL DEFAULT true,
  notify_on_call_failed BOOLEAN NOT NULL DEFAULT true,
  include_transcript BOOLEAN NOT NULL DEFAULT false,
  include_summary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view slack integrations for their workspace"
ON public.slack_integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = slack_integrations.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create slack integrations"
ON public.slack_integrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = slack_integrations.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update slack integrations"
ON public.slack_integrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = slack_integrations.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete slack integrations"
ON public.slack_integrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = slack_integrations.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_slack_integrations_updated_at
BEFORE UPDATE ON public.slack_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add demo workspace record for testing
INSERT INTO public.slack_integrations (workspace_id, name, webhook_url, channel_name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'サンプルSlack通知', 'https://hooks.slack.com/services/EXAMPLE', '#general', false)
ON CONFLICT DO NOTHING;