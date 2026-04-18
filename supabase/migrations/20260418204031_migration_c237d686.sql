-- Remove NOT NULL constraint from creator_id (properly this time)
ALTER TABLE competitions 
  ALTER COLUMN creator_id DROP NOT NULL;

-- Verify the service already sets both fields correctly
-- The competitionService.ts code already includes:
-- creator_id: competitionData.organizer_id