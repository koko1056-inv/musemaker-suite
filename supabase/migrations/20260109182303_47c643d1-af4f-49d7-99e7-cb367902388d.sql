-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to call the process-scheduled-calls edge function
CREATE OR REPLACE FUNCTION public.trigger_process_scheduled_calls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get secrets from vault (these are automatically available)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, construct URL from project reference
  IF supabase_url IS NULL THEN
    supabase_url := 'https://zbitxxuhywapoadpgzsv.supabase.co';
  END IF;
  
  -- Make HTTP request to edge function using pg_net extension
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-scheduled-calls',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(service_role_key, current_setting('request.jwt.claim.sub', true))
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Enable pg_net for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-calls',
  '* * * * *',  -- Every minute
  $$SELECT public.trigger_process_scheduled_calls()$$
);