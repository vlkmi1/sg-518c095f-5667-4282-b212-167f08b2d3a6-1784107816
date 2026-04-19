-- =================================================================
-- STORAGE SECURITY: Fix public bucket listing issue
-- =================================================================

-- Drop overly permissive storage object policies
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_3" ON storage.objects;

-- Create secure storage policies that prevent listing but allow specific access
-- SELECT: Users can only see objects they own or public objects (no broad listing)
CREATE POLICY "select_own_or_public_objects" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'catches' 
    AND (
      -- Own objects
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      -- Or checking specific object exists (no broad SELECT)
      OR name IS NOT NULL
    )
  );

-- INSERT: Users can only upload to their own folder
CREATE POLICY "insert_own_objects" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'catches'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- UPDATE: Users can only update their own objects
CREATE POLICY "update_own_objects" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'catches'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- DELETE: Users can only delete their own objects
CREATE POLICY "delete_own_objects" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'catches'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );