-- Add OAuth token columns to calendar_integrations table
ALTER TABLE public.calendar_integrations
ADD COLUMN IF NOT EXISTS is_authorized BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;