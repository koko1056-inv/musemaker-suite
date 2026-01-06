-- Add policies for demo workspace access to agent_folders
CREATE POLICY "Allow public read demo folders"
ON public.agent_folders
FOR SELECT
USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow public create demo folders"
ON public.agent_folders
FOR INSERT
WITH CHECK (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow public update demo folders"
ON public.agent_folders
FOR UPDATE
USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow public delete demo folders"
ON public.agent_folders
FOR DELETE
USING (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);