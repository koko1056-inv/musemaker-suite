-- Add message_template column to slack_integrations
ALTER TABLE public.slack_integrations
ADD COLUMN message_template TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.slack_integrations.message_template IS 'Custom message template with variables like {{agent_name}}, {{phone_number}}, {{duration}}, {{summary}}, {{transcript}}';