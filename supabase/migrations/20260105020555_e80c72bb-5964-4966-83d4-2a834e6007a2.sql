-- Add Twilio credentials columns to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT;