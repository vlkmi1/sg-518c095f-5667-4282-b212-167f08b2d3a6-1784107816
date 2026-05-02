-- Create RLS policies for avatars bucket (same pattern as catches bucket)

-- 1. Allow authenticated users to upload their own avatars
CREATE POLICY "auth_insert_own_avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to update their own avatars
CREATE POLICY "auth_update_own_avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to delete their own avatars
CREATE POLICY "auth_delete_own_avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow public to view avatars (for profile pictures)
CREATE POLICY "public_read_avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');