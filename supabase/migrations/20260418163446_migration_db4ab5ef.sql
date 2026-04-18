-- Remove NOT NULL constraints from optional location fields
ALTER TABLE catches ALTER COLUMN country DROP NOT NULL;
ALTER TABLE catches ALTER COLUMN region DROP NOT NULL;
ALTER TABLE catches ALTER COLUMN district DROP NOT NULL;