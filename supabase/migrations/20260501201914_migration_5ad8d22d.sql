-- Add min_weight_kg column to competitions table
ALTER TABLE competitions 
ADD COLUMN min_weight_kg numeric(10,2) NULL;

COMMENT ON COLUMN competitions.min_weight_kg IS 'Minimální váha v kg pro započítání úlovku do závodu (null = všechny úlovky se počítají)';