-- Add scoring_table column to competitions table for point-based competitions
ALTER TABLE competitions 
  ADD COLUMN IF NOT EXISTS scoring_table JSONB;

-- Add scoring_type to differentiate between measurement and point-based competitions
ALTER TABLE competitions 
  ADD COLUMN IF NOT EXISTS scoring_type TEXT DEFAULT 'measurement' CHECK (scoring_type IN ('measurement', 'points'));

COMMENT ON COLUMN competitions.scoring_table IS 'For point-based competitions: {"Kapr": 10, "Amur": 15, "Štika": 20}';
COMMENT ON COLUMN competitions.scoring_type IS 'Type of competition: measurement (weight/length) or points (species-based scoring)';