-- Create contact_messages table for feedback and suggestions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert messages (anonymous submissions)
CREATE POLICY "anon_insert_contact" ON contact_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Only admins can read messages (for future admin panel)
CREATE POLICY "admin_read_contact" ON contact_messages 
  FOR SELECT 
  USING (false); -- Will be updated when admin system is ready

COMMENT ON TABLE contact_messages IS 'Stores contact form submissions and improvement suggestions';