-- Drop the old policy
DROP POLICY IF EXISTS select_catches ON catches;

-- Create new policy that allows:
-- 1. Public catches (is_public = true)
-- 2. Own catches (user_id = auth.uid())
-- 3. ALL competition catches are publicly visible (competition_id IS NOT NULL)
CREATE POLICY select_catches ON catches
FOR SELECT
USING (
  is_public = true 
  OR user_id = auth.uid()
  OR competition_id IS NOT NULL  -- All competition catches are public
);