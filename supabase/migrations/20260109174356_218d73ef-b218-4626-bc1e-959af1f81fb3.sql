-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert extracted data" ON public.conversation_extracted_data;

-- Create a more secure policy that requires workspace membership for inserts
-- Service role will bypass RLS anyway, this policy is for authenticated users
CREATE POLICY "Users can insert extracted data via workspace membership"
ON public.conversation_extracted_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.agents a ON c.agent_id = a.id
    JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
    WHERE c.id = conversation_extracted_data.conversation_id
    AND wm.user_id = auth.uid()
  )
);