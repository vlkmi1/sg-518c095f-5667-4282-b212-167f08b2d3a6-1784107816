-- Add location fields to catches table
ALTER TABLE catches 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

COMMENT ON COLUMN catches.country IS 'Country where the fish was caught';
COMMENT ON COLUMN catches.region IS 'Region/State/Kraj where the fish was caught';
COMMENT ON COLUMN catches.district IS 'District/Okres where the fish was caught';