-- Add message_template column to email_notifications table
ALTER TABLE public.email_notifications 
ADD COLUMN IF NOT EXISTS message_template TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.email_notifications.message_template IS 'Custom email template with variable placeholders like {{agent_name}}, {{summary}}, {{extracted.field_key}}';