-- Fix Storage RLS policies for catches bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catches');

-- Allow public read access to all files
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'catches');

-- Allow users to update their own files
CREATE POLICY "authenticated_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'catches');

-- Allow users to delete their own files
CREATE POLICY "authenticated_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'catches');