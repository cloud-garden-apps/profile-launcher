-- Create thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  ideas jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own thoughts
CREATE POLICY "Users can manage own thoughts" ON thoughts
  FOR ALL USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX thoughts_user_id_idx ON thoughts(user_id);
