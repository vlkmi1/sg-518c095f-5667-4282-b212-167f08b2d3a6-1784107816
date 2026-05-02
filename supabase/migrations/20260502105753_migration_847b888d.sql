-- Drop old constraint
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_scoring_type_check;

-- Add corrected constraint that matches the code
ALTER TABLE competitions 
ADD CONSTRAINT competitions_scoring_type_check 
CHECK (scoring_type IN ('points', 'measurements'));

-- Update any existing rows that have old values
UPDATE competitions 
SET scoring_type = 'measurements' 
WHERE scoring_type IN ('measurement', 'length', 'weight', 'both');