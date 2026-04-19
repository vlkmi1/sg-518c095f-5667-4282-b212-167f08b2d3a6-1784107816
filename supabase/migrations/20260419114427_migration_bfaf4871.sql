-- Add competition_id to catches table to link catches to competitions
ALTER TABLE catches 
ADD COLUMN IF NOT EXISTS competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE;

COMMENT ON COLUMN catches.competition_id IS 'Competition this catch belongs to (null if not competition catch)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_catches_competition_id ON catches(competition_id);