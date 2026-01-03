-- Create a default workspace for demo purposes
INSERT INTO public.workspaces (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'デモワークスペース', 'demo', 'free')
ON CONFLICT (id) DO NOTHING;

-- Add RLS policy to allow anonymous access to demo workspace for development
CREATE POLICY "Allow public read of demo workspace"
ON public.workspaces FOR SELECT
USING (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow public to view agents in demo workspace
CREATE POLICY "Allow public read of demo agents"
ON public.agents FOR SELECT
USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow public to create agents in demo workspace
CREATE POLICY "Allow public create demo agents"
ON public.agents FOR INSERT
WITH CHECK (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow public to update agents in demo workspace
CREATE POLICY "Allow public update demo agents"
ON public.agents FOR UPDATE
USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow public to delete agents in demo workspace
CREATE POLICY "Allow public delete demo agents"
ON public.agents FOR DELETE
USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);