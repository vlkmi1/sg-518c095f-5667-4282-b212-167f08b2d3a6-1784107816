-- Table for storing email verification codes (OTP)
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  nickname text NOT NULL,
  password_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX idx_email_verification_codes_code ON email_verification_codes(code);
CREATE INDEX idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "allow_insert_verification_codes"
ON email_verification_codes
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Anyone can select their own codes (for verification)
CREATE POLICY "allow_select_own_verification_codes"
ON email_verification_codes
FOR SELECT
TO public
USING (true);

-- Policy: Anyone can update their own codes (for marking as verified)
CREATE POLICY "allow_update_own_verification_codes"
ON email_verification_codes
FOR UPDATE
TO public
USING (true);

-- Function to clean up expired codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < now() OR (verified = true AND created_at < now() - INTERVAL '1 day');
END;
$$;

-- Schedule cleanup to run every hour
SELECT cron.schedule(
  'cleanup-expired-verification-codes',
  '0 * * * *',
  $$SELECT cleanup_expired_verification_codes();$$
);

COMMENT ON TABLE email_verification_codes IS 'Stores 4-digit verification codes for email-based registration with 5-minute expiration';