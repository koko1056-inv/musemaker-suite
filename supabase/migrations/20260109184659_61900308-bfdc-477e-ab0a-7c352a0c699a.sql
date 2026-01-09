-- Make knowledge-files bucket public so files can be accessed
UPDATE storage.buckets SET public = true WHERE id = 'knowledge-files';

-- Create or update storage policies for knowledge-files bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- Policy for uploading files (authenticated users only)
CREATE POLICY "Allow authenticated users to upload knowledge files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'knowledge-files');

-- Policy for reading files (public access)
CREATE POLICY "Allow public access to knowledge files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'knowledge-files');

-- Policy for deleting files (authenticated users only)
CREATE POLICY "Allow authenticated users to delete knowledge files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'knowledge-files');