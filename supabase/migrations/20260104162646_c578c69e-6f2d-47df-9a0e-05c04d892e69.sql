-- Create phone_numbers table for Twilio integration
CREATE TABLE public.phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  phone_number_sid TEXT NOT NULL,
  label TEXT,
  provider TEXT NOT NULL DEFAULT 'twilio',
  status TEXT NOT NULL DEFAULT 'active',
  capabilities JSONB DEFAULT '{"voice": true, "sms": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pronunciation_rules table for custom pronunciations
CREATE TABLE public.pronunciation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  pronunciation TEXT NOT NULL,
  phoneme_type TEXT DEFAULT 'ipa',
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escalation_rules table for human handoff
CREATE TABLE public.escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL DEFAULT 'keyword',
  trigger_value TEXT,
  action_type TEXT NOT NULL DEFAULT 'transfer',
  transfer_number TEXT,
  webhook_url TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outbound_calls table for tracking outbound calls
CREATE TABLE public.outbound_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  to_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  call_sid TEXT,
  result TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronunciation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_calls ENABLE ROW LEVEL SECURITY;

-- RLS policies for phone_numbers
CREATE POLICY "Workspace members can view phone numbers"
  ON public.phone_numbers FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can manage phone numbers"
  ON public.phone_numbers FOR ALL
  USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Allow demo workspace phone numbers"
  ON public.phone_numbers FOR ALL
  USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- RLS policies for pronunciation_rules
CREATE POLICY "Workspace members can view pronunciation rules"
  ON public.pronunciation_rules FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can manage pronunciation rules"
  ON public.pronunciation_rules FOR ALL
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Allow demo workspace pronunciation rules"
  ON public.pronunciation_rules FOR ALL
  USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- RLS policies for escalation_rules
CREATE POLICY "Members can view escalation rules"
  ON public.escalation_rules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = escalation_rules.agent_id
    AND is_workspace_member(auth.uid(), a.workspace_id)
  ));

CREATE POLICY "Members can manage escalation rules"
  ON public.escalation_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = escalation_rules.agent_id
    AND is_workspace_member(auth.uid(), a.workspace_id)
  ));

CREATE POLICY "Allow demo workspace escalation rules"
  ON public.escalation_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = escalation_rules.agent_id
    AND a.workspace_id = '00000000-0000-0000-0000-000000000001'::uuid
  ));

-- RLS policies for outbound_calls
CREATE POLICY "Workspace members can view outbound calls"
  ON public.outbound_calls FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can manage outbound calls"
  ON public.outbound_calls FOR ALL
  USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Allow demo workspace outbound calls"
  ON public.outbound_calls FOR ALL
  USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Add triggers for updated_at
CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pronunciation_rules_updated_at
  BEFORE UPDATE ON public.pronunciation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escalation_rules_updated_at
  BEFORE UPDATE ON public.escalation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outbound_calls_updated_at
  BEFORE UPDATE ON public.outbound_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();