-- Add nickname column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text UNIQUE;

-- Create index for nickname lookups
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);

-- Update RLS to allow nickname-based queries
CREATE POLICY "select_by_nickname" ON profiles
  FOR SELECT
  USING (true);