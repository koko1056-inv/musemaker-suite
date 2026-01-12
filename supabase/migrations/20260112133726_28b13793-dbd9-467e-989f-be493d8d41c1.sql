-- Add first_message column to agents table
ALTER TABLE public.agents 
ADD COLUMN first_message text;

-- Add comment
COMMENT ON COLUMN public.agents.first_message IS 'The first message the agent speaks when a conversation starts';