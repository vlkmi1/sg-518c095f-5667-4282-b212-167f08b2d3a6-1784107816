-- Add is_public column to catches table
ALTER TABLE catches ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Update RLS policy to respect is_public flag
DROP POLICY IF EXISTS "public_read" ON catches;
CREATE POLICY "public_read" ON catches
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);