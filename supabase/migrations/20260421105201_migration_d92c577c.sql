-- Create fish weight reference table
CREATE TABLE fish_weight_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL,
  length_cm INTEGER NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(species, length_cm)
);

-- Enable RLS
ALTER TABLE fish_weight_table ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can query the reference table)
CREATE POLICY "public_read_weight_table" ON fish_weight_table
  FOR SELECT USING (true);

-- Create index for fast lookups
CREATE INDEX fish_weight_table_species_length_idx ON fish_weight_table(species, length_cm);

COMMENT ON TABLE fish_weight_table IS 'Reference table for fish weight estimation based on species and length';