-- Create knowledge_base_folders table
CREATE TABLE public.knowledge_base_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to knowledge_bases table
ALTER TABLE public.knowledge_bases ADD COLUMN folder_id UUID REFERENCES public.knowledge_base_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.knowledge_base_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for demo workspace
CREATE POLICY "Allow public read demo kb folders" ON public.knowledge_base_folders
  FOR SELECT USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow public create demo kb folders" ON public.knowledge_base_folders
  FOR INSERT WITH CHECK (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow public update demo kb folders" ON public.knowledge_base_folders
  FOR UPDATE USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow public delete demo kb folders" ON public.knowledge_base_folders
  FOR DELETE USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- RLS policies for workspace members
CREATE POLICY "Users can view kb folders in their workspace" ON public.knowledge_base_folders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = knowledge_base_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create kb folders in their workspace" ON public.knowledge_base_folders
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = knowledge_base_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can update kb folders in their workspace" ON public.knowledge_base_folders
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = knowledge_base_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete kb folders in their workspace" ON public.knowledge_base_folders
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = knowledge_base_folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_knowledge_base_folders_updated_at
  BEFORE UPDATE ON public.knowledge_base_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();