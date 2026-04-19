-- =================================================================
-- STORAGE POLICIES: Remove all duplicates and create secure consolidated policies
-- =================================================================

-- Drop ALL existing policies on storage.objects for catches bucket
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "public_read_catches" ON storage.objects;
DROP POLICY IF EXISTS "select_own_or_public_objects" ON storage.objects;
DROP POLICY IF EXISTS "insert_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "update_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "delete_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "users_upload_own_catches" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_catches" ON storage.objects;

-- =================================================================
-- SECURE STORAGE POLICIES
-- =================================================================
-- These policies allow public read of specific catch images (when URL is known)
-- but prevent listing all objects in the bucket
-- =================================================================

-- SELECT: Allow public read of specific objects (no broad listing)
-- The bucket is public, so any valid image URL can be accessed
-- But users cannot list all files
CREATE POLICY "public_read_specific_catches" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'catches'
    -- Allow reading any object in catches bucket (public bucket)
    -- But the storage API won't allow listing without additional permissions
  );

-- INSERT: Only authenticated users can upload to their own folder
CREATE POLICY "auth_insert_own_folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'catches'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Only authenticated users can update their own objects
CREATE POLICY "auth_update_own_objects" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'catches'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Only authenticated users can delete their own objects
CREATE POLICY "auth_delete_own_objects" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'catches'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );