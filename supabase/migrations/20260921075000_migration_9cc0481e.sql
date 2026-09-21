-- Add first_login_completed flag to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_login_completed boolean DEFAULT false;

-- Update existing profiles to mark as completed (they've been using the app)
UPDATE profiles SET first_login_completed = true WHERE created_at < now() - INTERVAL '1 hour';

COMMENT ON COLUMN profiles.first_login_completed IS 'Tracks if user has completed first-time profile setup after registration';