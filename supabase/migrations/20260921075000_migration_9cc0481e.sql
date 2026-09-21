-- Spustit migraci - vytvořit tabulku pro OTP kódy
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

ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

DROP POLICY IF EXISTS "allow_insert_verification_codes" ON email_verification_codes;
CREATE POLICY "allow_insert_verification_codes"
ON email_verification_codes
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_select_own_verification_codes" ON email_verification_codes;
CREATE POLICY "allow_select_own_verification_codes"
ON email_verification_codes
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "allow_update_own_verification_codes" ON email_verification_codes;
CREATE POLICY "allow_update_own_verification_codes"
ON email_verification_codes
FOR UPDATE
TO public
USING (true);

-- Verify table created
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_verification_codes';