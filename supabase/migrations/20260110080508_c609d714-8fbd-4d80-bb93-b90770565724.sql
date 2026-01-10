-- Add Google Calendar OAuth credentials to workspaces table
ALTER TABLE public.workspaces
ADD COLUMN google_client_id TEXT,
ADD COLUMN google_client_secret TEXT,
ADD COLUMN google_refresh_token TEXT;