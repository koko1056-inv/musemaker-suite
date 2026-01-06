-- Create folders table for organizing agents
CREATE TABLE public.agent_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to agents table
ALTER TABLE public.agents ADD COLUMN folder_id UUID REFERENCES public.agent_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.agent_folders ENABLE ROW LEVEL SECURITY;

-- Create policies for folder access
CREATE POLICY "Users can view folders in their workspace"
ON public.agent_folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = agent_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create folders in their workspace"
ON public.agent_folders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = agent_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update folders in their workspace"
ON public.agent_folders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = agent_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete folders in their workspace"
ON public.agent_folders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = agent_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_agents_folder_id ON public.agents(folder_id);
CREATE INDEX idx_agent_folders_workspace_id ON public.agent_folders(workspace_id);

-- Create trigger for updated_at
CREATE TRIGGER update_agent_folders_updated_at
BEFORE UPDATE ON public.agent_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();