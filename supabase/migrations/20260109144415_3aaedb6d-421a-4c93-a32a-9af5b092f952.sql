-- Add read status to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Add read status to outbound_calls table
ALTER TABLE public.outbound_calls 
ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Create index for faster queries on unread items
CREATE INDEX IF NOT EXISTS idx_conversations_is_read ON public.conversations(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_outbound_calls_is_read ON public.outbound_calls(is_read) WHERE is_read = false;