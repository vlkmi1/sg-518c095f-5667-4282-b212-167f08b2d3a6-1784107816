-- Add fishing_area column to catches table
ALTER TABLE catches ADD COLUMN IF NOT EXISTS fishing_area TEXT;