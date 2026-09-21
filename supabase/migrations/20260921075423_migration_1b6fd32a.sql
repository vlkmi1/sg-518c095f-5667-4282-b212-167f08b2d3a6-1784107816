-- Apply the migration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_login_completed boolean DEFAULT false;
UPDATE profiles SET first_login_completed = true WHERE created_at < now() - INTERVAL '1 hour';

-- Verify column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'first_login_completed';