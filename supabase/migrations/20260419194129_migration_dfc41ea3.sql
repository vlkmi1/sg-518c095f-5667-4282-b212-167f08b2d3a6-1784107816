-- =================================================================
-- CLEANUP: Remove duplicate and optimize RLS policies
-- =================================================================

-- ==================== CATCHES TABLE ====================
-- Drop all existing policies
DROP POLICY IF EXISTS "auth_delete_own_catches" ON catches;
DROP POLICY IF EXISTS "delete_own" ON catches;
DROP POLICY IF EXISTS "auth_insert_catches" ON catches;
DROP POLICY IF EXISTS "auth_update_own_catches" ON catches;
DROP POLICY IF EXISTS "public_read" ON catches;
DROP POLICY IF EXISTS "public_read_catches" ON catches;

-- Create optimized consolidated policies with auth.uid() subquery pattern
CREATE POLICY "select_catches" ON catches
  FOR SELECT
  USING (
    is_public = true 
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "insert_catches" ON catches
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "update_own_catches" ON catches
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "delete_own_catches" ON catches
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ==================== PROFILES TABLE ====================
-- Drop all existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "public_read" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "delete_own" ON profiles;

-- Create optimized consolidated policies
CREATE POLICY "select_profiles" ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()));

CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE
  USING (id = (SELECT auth.uid()));

-- ==================== COMPETITIONS TABLE ====================
-- Drop all existing policies
DROP POLICY IF EXISTS "auth_create_competitions" ON competitions;
DROP POLICY IF EXISTS "auth_insert" ON competitions;
DROP POLICY IF EXISTS "creator_delete_competitions" ON competitions;
DROP POLICY IF EXISTS "creator_update_competitions" ON competitions;
DROP POLICY IF EXISTS "public_read_competitions" ON competitions;

-- Create optimized consolidated policies
CREATE POLICY "select_competitions" ON competitions
  FOR SELECT
  USING (true);

CREATE POLICY "insert_competitions" ON competitions
  FOR INSERT
  WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "update_own_competitions" ON competitions
  FOR UPDATE
  USING (creator_id = (SELECT auth.uid()));

CREATE POLICY "delete_own_competitions" ON competitions
  FOR DELETE
  USING (creator_id = (SELECT auth.uid()));

-- ==================== COMPETITION_PARTICIPANTS TABLE ====================
-- Drop existing policies
DROP POLICY IF EXISTS "auth_join_competition" ON competition_participants;
DROP POLICY IF EXISTS "public_read_participants" ON competition_participants;
DROP POLICY IF EXISTS "user_leave_competition" ON competition_participants;

-- Create optimized policies
CREATE POLICY "select_participants" ON competition_participants
  FOR SELECT
  USING (true);

CREATE POLICY "insert_participants" ON competition_participants
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "delete_participants" ON competition_participants
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ==================== COMPETITION_CATCHES TABLE ====================
-- Drop existing policies
DROP POLICY IF EXISTS "creator_approve_catch" ON competition_catches;
DROP POLICY IF EXISTS "participant_submit_catch" ON competition_catches;
DROP POLICY IF EXISTS "public_read_competition_catches" ON competition_catches;

-- Create optimized policies
CREATE POLICY "select_competition_catches" ON competition_catches
  FOR SELECT
  USING (true);

CREATE POLICY "insert_competition_catches" ON competition_catches
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM competition_participants 
      WHERE competition_id = competition_catches.competition_id
    )
  );

CREATE POLICY "update_competition_catches" ON competition_catches
  FOR UPDATE
  USING (
    (SELECT auth.uid()) IN (
      SELECT creator_id FROM competitions 
      WHERE id = competition_catches.competition_id
    )
  );

-- ==================== CONTACT_MESSAGES TABLE ====================
-- Keep existing policies - they're correct for public contact form
-- anon_insert_contact with CHECK (true) is intentional
-- admin_read_contact with USING (false) should be updated to check admin status

DROP POLICY IF EXISTS "admin_read_contact" ON contact_messages;

CREATE POLICY "admin_read_contact" ON contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND is_admin = true
    )
  );