-- Add icon and color columns to agents table
ALTER TABLE public.agents 
ADD COLUMN icon_name text DEFAULT 'bot',
ADD COLUMN icon_color text DEFAULT '#10b981';