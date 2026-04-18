-- Create storage bucket for catch images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('catches', 'catches', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own catch images
CREATE POLICY "users_upload_own_catches" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'catches' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to all catch images
CREATE POLICY "public_read_catches" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'catches');

-- Allow users to delete their own catch images
CREATE POLICY "users_delete_own_catches" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catches' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );