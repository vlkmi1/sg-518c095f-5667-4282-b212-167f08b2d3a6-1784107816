-- Tabulka pro trofeje
CREATE TABLE trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fish_species TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  period_end_date DATE NOT NULL,
  weight_kg NUMERIC(6,2) NOT NULL,
  length_cm NUMERIC(6,2) NOT NULL,
  position INTEGER NOT NULL DEFAULT 1 CHECK (position IN (1, 2, 3)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fish_species, period_type, period_end_date, position)
);

-- Tabulka pro notifikace o trofejích
CREATE TABLE trophy_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trophy_id UUID NOT NULL REFERENCES trophies(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pro rychlé vyhledávání
CREATE INDEX idx_trophies_user_id ON trophies(user_id);
CREATE INDEX idx_trophies_period ON trophies(period_type, period_end_date);
CREATE INDEX idx_trophy_notifications_user_unread ON trophy_notifications(user_id, is_read) WHERE is_read = false;

-- RLS politiky pro trophies
ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_trophies" ON trophies
  FOR SELECT USING (true);

CREATE POLICY "system_insert_trophies" ON trophies
  FOR INSERT WITH CHECK (true);

-- RLS politiky pro trophy_notifications
ALTER TABLE trophy_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications" ON trophy_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications" ON trophy_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "system_insert_notifications" ON trophy_notifications
  FOR INSERT WITH CHECK (true);