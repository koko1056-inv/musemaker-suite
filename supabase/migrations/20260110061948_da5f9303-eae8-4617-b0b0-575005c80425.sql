-- Create storage bucket for agent icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-icons', 'agent-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own agent icons
CREATE POLICY "Users can upload agent icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-icons');

-- Allow anyone to view agent icons (public bucket)
CREATE POLICY "Agent icons are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'agent-icons');

-- Allow authenticated users to update their own agent icons
CREATE POLICY "Users can update agent icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-icons');

-- Allow authenticated users to delete their own agent icons
CREATE POLICY "Users can delete agent icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'agent-icons');