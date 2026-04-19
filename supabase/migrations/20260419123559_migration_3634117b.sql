-- Add terminated_early flag to competitions
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS terminated_early BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN competitions.terminated_early IS 'True if competition was terminated early by creator';