-- ============================================
-- MINI QUIZ PARTICIPATION & LEADERBOARD SYSTEM
-- ============================================

-- 1. Table to track user progress/score in a mini quiz
CREATE TABLE IF NOT EXISTS mini_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES mini_quizzes(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  time_taken_seconds integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  status text DEFAULT 'in_progress', -- in_progress, completed
  
  -- Ensure one attempt per user per quiz (if that's the rule)
  UNIQUE(user_id, quiz_id)
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_mini_quiz_attempts_quiz_score ON mini_quiz_attempts(quiz_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_mini_quiz_attempts_user ON mini_quiz_attempts(user_id);

-- Enable RLS
ALTER TABLE mini_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Read: Users can see their own attempts
CREATE POLICY "Users can view own attempts" ON mini_quiz_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Read: Everyone can see completed attempts (for Leaderboard)
CREATE POLICY "Public can view leaderboard" ON mini_quiz_attempts
  FOR SELECT TO authenticated USING (status = 'completed');

-- Write: Users can insert/update their own attempt
CREATE POLICY "Users can insert own attempt" ON mini_quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempt" ON mini_quiz_attempts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to get top 10 leaderboard for a quiz (optional RPC helper)
CREATE OR REPLACE FUNCTION get_mini_quiz_leaderboard(p_quiz_id uuid)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  name text,
  avatar_url text,
  score integer,
  time_taken_seconds integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    RANK() OVER (ORDER BY mqa.score DESC, mqa.time_taken_seconds ASC) as rank,
    u.id as user_id,
    u.name,
    u.avatar_url,
    mqa.score,
    mqa.time_taken_seconds
  FROM mini_quiz_attempts mqa
  JOIN users u ON mqa.user_id = u.id
  WHERE mqa.quiz_id = p_quiz_id AND mqa.status = 'completed'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
