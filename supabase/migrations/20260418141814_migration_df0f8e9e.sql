-- Fix RLS policies for profiles table
-- The trigger needs to insert new profiles when users sign up

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "select_own" ON profiles;
DROP POLICY IF EXISTS "select_by_nickname" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "delete_own" ON profiles;

-- Allow public read access (for displaying usernames in catch cards)
CREATE POLICY "public_read" ON profiles
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile (needed for trigger)
CREATE POLICY "insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "delete_own" ON profiles
  FOR DELETE
  USING (auth.uid() = id);