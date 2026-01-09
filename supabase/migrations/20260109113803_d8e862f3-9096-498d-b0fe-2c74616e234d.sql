-- Fix overly-permissive RLS policies flagged by the linter

-- 1) audit_logs: prevent forging logs for other users
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2) conversations: prevent public/unauthenticated inserts
DROP POLICY IF EXISTS "System can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations of accessible agents"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.agents a
    WHERE a.id = conversations.agent_id
      AND public.is_workspace_member(auth.uid(), a.workspace_id)
  )
);