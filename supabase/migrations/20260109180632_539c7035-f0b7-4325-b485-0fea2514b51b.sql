-- Add agent_ids column to slack_integrations
ALTER TABLE public.slack_integrations 
ADD COLUMN agent_ids uuid[] DEFAULT NULL;

-- Add agent_ids column to email_notifications
ALTER TABLE public.email_notifications 
ADD COLUMN agent_ids uuid[] DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN public.slack_integrations.agent_ids IS 'Selected agent IDs for notification filtering. NULL means all agents.';
COMMENT ON COLUMN public.email_notifications.agent_ids IS 'Selected agent IDs for notification filtering. NULL means all agents.';