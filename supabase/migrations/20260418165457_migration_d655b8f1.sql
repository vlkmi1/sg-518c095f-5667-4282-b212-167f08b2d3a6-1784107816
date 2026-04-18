-- Add full_name and location columns to profiles table if they don't exist
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;