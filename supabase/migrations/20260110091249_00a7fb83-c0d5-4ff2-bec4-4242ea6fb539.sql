-- Create a table for Google Calendar integrations
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calendar_id TEXT,
  event_duration_minutes INTEGER NOT NULL DEFAULT 30,
  create_on_call_end BOOLEAN NOT NULL DEFAULT true,
  create_on_call_failed BOOLEAN NOT NULL DEFAULT false,
  event_title_template TEXT NOT NULL DEFAULT '{{agent_name}} - {{phone_number}}',
  event_description_template TEXT NOT NULL DEFAULT '通話日時: {{datetime}}\n電話番号: {{phone_number}}\n要約: {{summary}}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view calendar integrations in their workspace" 
ON public.calendar_integrations 
FOR SELECT 
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can create calendar integrations" 
ON public.calendar_integrations 
FOR INSERT 
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update calendar integrations" 
ON public.calendar_integrations 
FOR UPDATE 
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete calendar integrations" 
ON public.calendar_integrations 
FOR DELETE 
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendar_integrations_updated_at
BEFORE UPDATE ON public.calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_calendar_integrations_workspace ON public.calendar_integrations(workspace_id);
CREATE INDEX idx_calendar_integrations_agent ON public.calendar_integrations(agent_id);