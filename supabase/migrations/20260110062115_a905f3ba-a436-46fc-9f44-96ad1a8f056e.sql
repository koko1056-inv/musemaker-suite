-- Add custom_icon_url column to agents table for storing uploaded icon URLs
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS custom_icon_url TEXT;