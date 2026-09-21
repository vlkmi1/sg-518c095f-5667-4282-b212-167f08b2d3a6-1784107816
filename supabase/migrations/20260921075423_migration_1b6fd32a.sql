-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create unique index on nickname (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_key ON profiles(nickname);

COMMENT ON COLUMN profiles.nickname IS 'User display name/nickname';
COMMENT ON COLUMN profiles.bio IS 'User biography/about me text';