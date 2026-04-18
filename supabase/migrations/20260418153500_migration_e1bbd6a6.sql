-- Create competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('beer', 'bottle', 'none')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scoring_type TEXT NOT NULL CHECK (scoring_type IN ('length', 'weight', 'both')),
  top_catches_count INTEGER DEFAULT NULL,
  auto_approve BOOLEAN NOT NULL DEFAULT true,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competition_participants table
CREATE TABLE IF NOT EXISTS competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, user_id)
);

-- Create competition_catches table (links catches to competitions)
CREATE TABLE IF NOT EXISTS competition_catches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, catch_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS competitions_creator_id_idx ON competitions(creator_id);
CREATE INDEX IF NOT EXISTS competitions_invite_code_idx ON competitions(invite_code);
CREATE INDEX IF NOT EXISTS competition_participants_competition_id_idx ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS competition_participants_user_id_idx ON competition_participants(user_id);
CREATE INDEX IF NOT EXISTS competition_catches_competition_id_idx ON competition_catches(competition_id);
CREATE INDEX IF NOT EXISTS competition_catches_catch_id_idx ON competition_catches(catch_id);

-- RLS policies for competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_competitions" ON competitions
  FOR SELECT
  USING (true);

CREATE POLICY "auth_create_competitions" ON competitions
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "creator_update_competitions" ON competitions
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "creator_delete_competitions" ON competitions
  FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS policies for competition_participants
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_participants" ON competition_participants
  FOR SELECT
  USING (true);

CREATE POLICY "auth_join_competition" ON competition_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_leave_competition" ON competition_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for competition_catches
ALTER TABLE competition_catches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_competition_catches" ON competition_catches
  FOR SELECT
  USING (true);

CREATE POLICY "participant_submit_catch" ON competition_catches
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM competition_participants
      WHERE competition_id = competition_catches.competition_id
    )
  );

CREATE POLICY "creator_approve_catch" ON competition_catches
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT creator_id FROM competitions
      WHERE id = competition_catches.competition_id
    )
  );