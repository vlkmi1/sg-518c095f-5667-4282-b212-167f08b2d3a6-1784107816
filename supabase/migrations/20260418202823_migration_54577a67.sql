-- Fix competitions table structure to match expected schema
-- Add missing columns and fix constraints

-- Add organizer_id if it doesn't exist (using creator_id as alias)
ALTER TABLE competitions 
  ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Migrate data from creator_id to organizer_id
UPDATE competitions SET organizer_id = creator_id WHERE organizer_id IS NULL;

-- Add scoring_metric column for measurement-based competitions
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS scoring_metric text;

-- Add description column
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS description text;

-- Add is_public column
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Add join_code column if not exists
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS join_code text;

-- Update scoring_type constraint to include 'measurement' and 'points'
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_scoring_type_check;
ALTER TABLE competitions 
  ADD CONSTRAINT competitions_scoring_type_check 
  CHECK (scoring_type IN ('measurement', 'points', 'length', 'weight', 'both'));

-- Make invite_code nullable temporarily for migration
ALTER TABLE competitions ALTER COLUMN invite_code DROP NOT NULL;

-- Migrate invite_code to join_code
UPDATE competitions SET join_code = invite_code WHERE join_code IS NULL;