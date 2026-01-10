-- Create workspace_invitations table
CREATE TABLE public.workspace_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.member_role NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, email)
);

-- Enable RLS
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Workspace admins and owners can view invitations
CREATE POLICY "Admins can view workspace invitations"
ON public.workspace_invitations
FOR SELECT
TO authenticated
USING (
    public.is_workspace_admin(auth.uid(), workspace_id)
);

-- Policy: Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.workspace_invitations
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_workspace_admin(auth.uid(), workspace_id)
    AND invited_by = auth.uid()
);

-- Policy: Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.workspace_invitations
FOR DELETE
TO authenticated
USING (
    public.is_workspace_admin(auth.uid(), workspace_id)
);

-- Policy: Users can view their own invitations by token
CREATE POLICY "Users can view their invitations"
ON public.workspace_invitations
FOR SELECT
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(invitation_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation workspace_invitations%ROWTYPE;
    v_user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
    
    -- Get and validate invitation
    SELECT * INTO v_invitation 
    FROM workspace_invitations 
    WHERE token = invitation_token
    AND email = v_user_email
    AND accepted_at IS NULL
    AND expires_at > now();
    
    IF v_invitation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', '招待が見つからないか、期限切れです');
    END IF;
    
    -- Check if already a member
    IF EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = v_invitation.workspace_id 
        AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'すでにメンバーです');
    END IF;
    
    -- Add user to workspace
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (v_invitation.workspace_id, auth.uid(), v_invitation.role);
    
    -- Mark invitation as accepted
    UPDATE workspace_invitations 
    SET accepted_at = now() 
    WHERE id = v_invitation.id;
    
    RETURN jsonb_build_object('success', true, 'workspace_id', v_invitation.workspace_id);
END;
$$;

-- Function to update member role (for admins)
CREATE OR REPLACE FUNCTION public.update_member_role(
    p_member_id UUID,
    p_new_role public.member_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
    v_target_role public.member_role;
BEGIN
    -- Get member info
    SELECT workspace_id, role INTO v_workspace_id, v_target_role
    FROM workspace_members
    WHERE id = p_member_id;
    
    IF v_workspace_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if caller is admin
    IF NOT public.is_workspace_admin(auth.uid(), v_workspace_id) THEN
        RETURN false;
    END IF;
    
    -- Cannot change owner role
    IF v_target_role = 'owner' THEN
        RETURN false;
    END IF;
    
    -- Cannot promote to owner
    IF p_new_role = 'owner' THEN
        RETURN false;
    END IF;
    
    -- Update role
    UPDATE workspace_members
    SET role = p_new_role
    WHERE id = p_member_id;
    
    RETURN true;
END;
$$;

-- Function to remove member (for admins)
CREATE OR REPLACE FUNCTION public.remove_workspace_member(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
    v_target_role public.member_role;
    v_target_user_id UUID;
BEGIN
    -- Get member info
    SELECT workspace_id, role, user_id INTO v_workspace_id, v_target_role, v_target_user_id
    FROM workspace_members
    WHERE id = p_member_id;
    
    IF v_workspace_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if caller is admin
    IF NOT public.is_workspace_admin(auth.uid(), v_workspace_id) THEN
        RETURN false;
    END IF;
    
    -- Cannot remove owner
    IF v_target_role = 'owner' THEN
        RETURN false;
    END IF;
    
    -- Cannot remove self
    IF v_target_user_id = auth.uid() THEN
        RETURN false;
    END IF;
    
    -- Remove member
    DELETE FROM workspace_members WHERE id = p_member_id;
    
    RETURN true;
END;
$$;