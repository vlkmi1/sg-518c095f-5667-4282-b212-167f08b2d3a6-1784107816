-- Remove NOT NULL constraint from prize_type or set default value
ALTER TABLE competitions 
  ALTER COLUMN prize_type DROP NOT NULL;