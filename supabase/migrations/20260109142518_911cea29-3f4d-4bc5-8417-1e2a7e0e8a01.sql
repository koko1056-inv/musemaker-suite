-- Add conversation_id to outbound_calls to link with conversation records
ALTER TABLE public.outbound_calls
ADD COLUMN conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_outbound_calls_conversation_id ON public.outbound_calls(conversation_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN public.outbound_calls.conversation_id IS 'Links to the conversation record that contains transcript, summary, etc.';