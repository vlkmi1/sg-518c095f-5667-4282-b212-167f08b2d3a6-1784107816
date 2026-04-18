-- Add DELETE policy for users to delete their own catches
CREATE POLICY "delete_own" ON catches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);