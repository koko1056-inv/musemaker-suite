-- Create email_notifications table for email notification settings
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_on_call_start BOOLEAN NOT NULL DEFAULT false,
  notify_on_call_end BOOLEAN NOT NULL DEFAULT true,
  notify_on_call_failed BOOLEAN NOT NULL DEFAULT true,
  include_summary BOOLEAN NOT NULL DEFAULT true,
  include_transcript BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace members
CREATE POLICY "Workspace members can view email notifications"
  ON public.email_notifications
  FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can create email notifications"
  ON public.email_notifications
  FOR INSERT
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can update email notifications"
  ON public.email_notifications
  FOR UPDATE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can delete email notifications"
  ON public.email_notifications
  FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Create trigger for updated_at
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();