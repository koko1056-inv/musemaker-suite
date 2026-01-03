-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', true);

-- Allow anyone to read recordings (for playback)
CREATE POLICY "Anyone can read recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'call-recordings');

-- Allow system to insert recordings (via service role)
CREATE POLICY "System can insert recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'call-recordings');

-- Add audio_url column to conversations table
ALTER TABLE public.conversations
ADD COLUMN audio_url TEXT;