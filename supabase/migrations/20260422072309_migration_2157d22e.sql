-- Create competition_join_requests table
CREATE TABLE IF NOT EXISTS competition_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS competition_join_requests_competition_id_idx ON competition_join_requests(competition_id);
CREATE INDEX IF NOT EXISTS competition_join_requests_user_id_idx ON competition_join_requests(user_id);
CREATE INDEX IF NOT EXISTS competition_join_requests_status_idx ON competition_join_requests(status);

-- Enable RLS
ALTER TABLE competition_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own join requests
CREATE POLICY "insert_own_join_request" ON competition_join_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view their own requests
CREATE POLICY "view_own_join_requests" ON competition_join_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Competition creators can view requests for their competitions
CREATE POLICY "creator_view_join_requests" ON competition_join_requests
  FOR SELECT
  USING (
    competition_id IN (
      SELECT id FROM competitions WHERE creator_id = auth.uid()
    )
  );

-- Competition creators can update requests for their competitions
CREATE POLICY "creator_update_join_requests" ON competition_join_requests
  FOR UPDATE
  USING (
    competition_id IN (
      SELECT id FROM competitions WHERE creator_id = auth.uid()
    )
  );

-- Users can delete their own pending requests
CREATE POLICY "delete_own_pending_request" ON competition_join_requests
  FOR DELETE
  USING (user_id = auth.uid() AND status = 'pending');

COMMENT ON TABLE competition_join_requests IS 'Join requests for public competitions';
COMMENT ON COLUMN competition_join_requests.status IS 'Request status: pending, approved, or rejected';