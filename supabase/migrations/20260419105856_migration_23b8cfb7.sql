-- Add advanced scoring configuration to competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS fish_points JSONB,
ADD COLUMN IF NOT EXISTS measurement_type TEXT CHECK (measurement_type IN ('weight', 'length', 'both')),
ADD COLUMN IF NOT EXISTS top_catches_count INTEGER;

-- Add comment to explain the columns
COMMENT ON COLUMN competitions.fish_points IS 'JSON object mapping fish species to points (e.g., {"Kapr": 10, "Sumec": 15})';
COMMENT ON COLUMN competitions.measurement_type IS 'For measurements scoring: weight, length, or both';
COMMENT ON COLUMN competitions.top_catches_count IS 'Number of top catches to count per participant (null = all catches)';