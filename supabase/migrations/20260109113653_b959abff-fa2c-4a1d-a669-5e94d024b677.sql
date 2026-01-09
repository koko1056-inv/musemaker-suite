-- Ensure every authenticated user gets membership to the demo workspace used by the current UI.
-- This fixes RLS failures when creating knowledge_bases with workspace_id = 000...001.

CREATE OR REPLACE FUNCTION public.ensure_demo_workspace_membership()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _workspace_id uuid := '00000000-0000-0000-0000-000000000001';
  _member_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id
  INTO _member_id
  FROM public.workspace_members
  WHERE user_id = auth.uid()
    AND workspace_id = _workspace_id
  LIMIT 1;

  IF _member_id IS NULL THEN
    INSERT INTO public.workspace_members (user_id, workspace_id, role)
    VALUES (auth.uid(), _workspace_id, 'owner')
    RETURNING id INTO _member_id;
  END IF;

  RETURN _member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_demo_workspace_membership() TO authenticated;