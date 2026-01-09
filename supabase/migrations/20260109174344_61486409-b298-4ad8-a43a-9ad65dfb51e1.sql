-- Create table for agent extraction fields configuration
CREATE TABLE public.agent_extraction_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, field_key)
);

-- Create table for extracted values from conversations
CREATE TABLE public.conversation_extracted_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, field_key)
);

-- Enable Row Level Security
ALTER TABLE public.agent_extraction_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_extracted_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_extraction_fields (via agents -> workspaces)
CREATE POLICY "Users can view extraction fields via workspace membership"
ON public.agent_extraction_fields
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
    WHERE a.id = agent_extraction_fields.agent_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert extraction fields via workspace membership"
ON public.agent_extraction_fields
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
    WHERE a.id = agent_extraction_fields.agent_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update extraction fields via workspace membership"
ON public.agent_extraction_fields
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
    WHERE a.id = agent_extraction_fields.agent_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete extraction fields via workspace membership"
ON public.agent_extraction_fields
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
    WHERE a.id = agent_extraction_fields.agent_id
    AND wm.user_id = auth.uid()
  )
);

-- RLS policies for conversation_extracted_data (via conversations -> agents -> workspaces)
CREATE POLICY "Users can view extracted data via workspace membership"
ON public.conversation_extracted_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.agents a ON c.agent_id = a.id
    JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
    WHERE c.id = conversation_extracted_data.conversation_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert extracted data"
ON public.conversation_extracted_data
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_agent_extraction_fields_updated_at
BEFORE UPDATE ON public.agent_extraction_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_agent_extraction_fields_agent_id ON public.agent_extraction_fields(agent_id);
CREATE INDEX idx_conversation_extracted_data_conversation_id ON public.conversation_extracted_data(conversation_id);