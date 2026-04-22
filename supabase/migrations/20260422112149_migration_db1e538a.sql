-- Oprava RPC funkce pro ruční ověření emailu - použití DEFAULT místo NOW()
DROP FUNCTION IF EXISTS admin_verify_user_email(UUID);

CREATE OR REPLACE FUNCTION admin_verify_user_email(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if the calling user is an admin
  SELECT is_admin INTO is_admin_user
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only admins can verify user emails';
  END IF;

  -- Update the user's email confirmation in auth.users
  -- Use DEFAULT for confirmed_at as it has special constraints
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    confirmed_at = DEFAULT
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_verify_user_email(UUID) TO authenticated;