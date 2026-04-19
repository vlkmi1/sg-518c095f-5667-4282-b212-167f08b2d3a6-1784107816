-- Add avatar_path column to profiles table for easier deletion
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_path TEXT;