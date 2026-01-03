-- Create knowledge_bases table
CREATE TABLE public.knowledge_bases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_items table for individual FAQ/content items
CREATE TABLE public.knowledge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  file_url TEXT,
  file_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link agents to knowledge bases
CREATE TABLE public.agent_knowledge_bases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, knowledge_base_id)
);

-- Enable RLS
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_knowledge_bases ENABLE ROW LEVEL SECURITY;

-- RLS policies for knowledge_bases
CREATE POLICY "Users can view knowledge bases in their workspaces"
ON public.knowledge_bases FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create knowledge bases"
ON public.knowledge_bases FOR INSERT
WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update knowledge bases"
ON public.knowledge_bases FOR UPDATE
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete knowledge bases"
ON public.knowledge_bases FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- RLS policies for knowledge_items
CREATE POLICY "Users can view knowledge items"
ON public.knowledge_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.knowledge_bases kb
  WHERE kb.id = knowledge_items.knowledge_base_id
  AND is_workspace_member(auth.uid(), kb.workspace_id)
));

CREATE POLICY "Members can create knowledge items"
ON public.knowledge_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.knowledge_bases kb
  WHERE kb.id = knowledge_items.knowledge_base_id
  AND is_workspace_member(auth.uid(), kb.workspace_id)
));

CREATE POLICY "Members can update knowledge items"
ON public.knowledge_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.knowledge_bases kb
  WHERE kb.id = knowledge_items.knowledge_base_id
  AND is_workspace_member(auth.uid(), kb.workspace_id)
));

CREATE POLICY "Members can delete knowledge items"
ON public.knowledge_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.knowledge_bases kb
  WHERE kb.id = knowledge_items.knowledge_base_id
  AND is_workspace_member(auth.uid(), kb.workspace_id)
));

-- RLS policies for agent_knowledge_bases
CREATE POLICY "Users can view agent knowledge base links"
ON public.agent_knowledge_bases FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.agents a
  WHERE a.id = agent_knowledge_bases.agent_id
  AND is_workspace_member(auth.uid(), a.workspace_id)
));

CREATE POLICY "Members can link knowledge bases to agents"
ON public.agent_knowledge_bases FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.agents a
  WHERE a.id = agent_knowledge_bases.agent_id
  AND is_workspace_member(auth.uid(), a.workspace_id)
));

CREATE POLICY "Members can unlink knowledge bases from agents"
ON public.agent_knowledge_bases FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.agents a
  WHERE a.id = agent_knowledge_bases.agent_id
  AND is_workspace_member(auth.uid(), a.workspace_id)
));

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', false);

-- Storage policies
CREATE POLICY "Users can upload knowledge files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view knowledge files"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete knowledge files"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_knowledge_bases_updated_at
BEFORE UPDATE ON public.knowledge_bases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at
BEFORE UPDATE ON public.knowledge_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();