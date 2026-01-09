-- Tighten workspace_members INSERT policy to prevent users from joining arbitrary workspaces.
-- Current app uses a single demo workspace id on the frontend.

DROP POLICY IF EXISTS "Users can add themselves when creating workspace" ON public.workspace_members;

CREATE POLICY "Users can join demo workspace"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND workspace_id = '00000000-0000-0000-0000-000000000001'::uuid
);
