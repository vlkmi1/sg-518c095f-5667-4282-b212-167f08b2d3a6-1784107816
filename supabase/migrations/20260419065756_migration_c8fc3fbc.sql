-- Add is_hidden column to catches for admin moderation
ALTER TABLE catches 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;