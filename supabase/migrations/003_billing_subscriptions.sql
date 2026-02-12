CREATE TABLE IF NOT EXISTS app_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  tier text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS app_subscriptions_user_app_idx ON app_subscriptions(user_id, app_id);
CREATE INDEX IF NOT EXISTS app_subscriptions_customer_idx ON app_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS app_subscriptions_subscription_idx ON app_subscriptions(stripe_subscription_id);

ALTER TABLE app_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription" ON app_subscriptions;
CREATE POLICY "Users can read own subscription" ON app_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
