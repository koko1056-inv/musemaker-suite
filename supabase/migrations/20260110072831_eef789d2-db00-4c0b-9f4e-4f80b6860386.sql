-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can view their invitations" ON public.workspace_invitations;

-- Create a new policy that uses auth.email() instead of querying auth.users
CREATE POLICY "Users can view their invitations"
ON public.workspace_invitations
FOR SELECT
USING (email = auth.email());