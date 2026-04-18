-- Remove NOT NULL constraint from creator_id and make organizer_id the primary creator field
ALTER TABLE competitions ALTER COLUMN creator_id DROP NOT NULL;

-- Update existing records to use organizer_id
UPDATE competitions SET organizer_id = creator_id WHERE organizer_id IS NULL AND creator_id IS NOT NULL;