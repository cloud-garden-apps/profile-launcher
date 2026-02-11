CREATE TABLE IF NOT EXISTS google_business_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  google_account_sub text,
  google_account_email text,
  refresh_token_ciphertext text NOT NULL,
  refresh_token_iv text NOT NULL,
  refresh_token_tag text NOT NULL,
  token_scope text,
  token_type text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS gbc_user_app_idx ON google_business_connections(user_id, app_id);

ALTER TABLE google_business_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own google connections" ON google_business_connections;
CREATE POLICY "Users can read own google connections" ON google_business_connections
  FOR SELECT USING (auth.uid() = user_id);
