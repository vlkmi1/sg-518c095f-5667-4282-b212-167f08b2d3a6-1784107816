-- Drop and recreate update_own_profile policy with WITH CHECK
DROP POLICY IF EXISTS update_own_profile ON profiles;

CREATE POLICY update_own_profile ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());