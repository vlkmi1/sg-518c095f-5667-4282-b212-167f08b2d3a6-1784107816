-- Add bio column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;