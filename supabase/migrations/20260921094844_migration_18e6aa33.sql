-- Apply the migration to ensure avatar_path column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_path'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_path text;
    COMMENT ON COLUMN profiles.avatar_path IS 'Storage path for avatar file (used for deletion)';
    RAISE NOTICE 'Added avatar_path column to profiles table';
  ELSE
    RAISE NOTICE 'avatar_path column already exists';
  END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('avatar_url', 'avatar_path')
ORDER BY column_name;