-- Auto-approve all new comments
ALTER TABLE video_comments ALTER COLUMN approved SET DEFAULT TRUE;

-- Add reactions on comments table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL CHECK (emoji IN ('👍','❤️','😂','🔥')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, session_id, emoji)
);
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_comment_reactions" ON comment_reactions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "public_select_comment_reactions" ON comment_reactions FOR SELECT USING (TRUE);

-- Add reply_to column for nested comments
ALTER TABLE video_comments ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES video_comments(id) ON DELETE CASCADE;

-- Update public read policy to read ALL approved comments (already TRUE by default now)
DROP POLICY IF EXISTS "public_read_approved_comments" ON video_comments;
CREATE POLICY "public_read_all_comments" ON video_comments FOR SELECT USING (TRUE);
