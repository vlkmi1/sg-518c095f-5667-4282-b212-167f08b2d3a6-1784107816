-- Add admin and blocked columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Set vlk.miroslav as admin
UPDATE profiles 
SET is_admin = TRUE 
WHERE nickname = 'vlk.miroslav';