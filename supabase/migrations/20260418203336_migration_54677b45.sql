-- Add INSERT policy for competitions table
CREATE POLICY "auth_insert" ON competitions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);