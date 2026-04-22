-- Drop the old policy
DROP POLICY IF EXISTS select_catches ON catches;

-- Create new policy that allows viewing catches in competitions you're participating in
CREATE POLICY select_catches ON catches
FOR SELECT
USING (
  is_public = true 
  OR user_id = auth.uid()
  OR (
    competition_id IS NOT NULL 
    AND competition_id IN (
      SELECT competition_id 
      FROM competition_participants 
      WHERE user_id = auth.uid()
    )
  )
);