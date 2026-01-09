-- Add UPDATE policy for conversations table to allow marking as read
CREATE POLICY "Users can update conversations of accessible agents"
ON public.conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = conversations.agent_id 
    AND is_workspace_member(auth.uid(), a.workspace_id)
  )
);