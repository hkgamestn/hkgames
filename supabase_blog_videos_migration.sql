-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  content      TEXT NOT NULL DEFAULT '',
  cover_image  TEXT,
  tags         TEXT[] DEFAULT '{}',
  published    BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  views        INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published_posts" ON blog_posts FOR SELECT USING (published = TRUE);

-- Videos (Reels)
CREATE TABLE IF NOT EXISTS videos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  video_url    TEXT NOT NULL,
  thumbnail_url TEXT,
  tags         TEXT[] DEFAULT '{}',
  published    BOOLEAN DEFAULT FALSE,
  views        INT DEFAULT 0,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id   UUID REFERENCES videos(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL CHECK (emoji IN ('❤️','🔥','😍','😂','🤩')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, session_id, emoji)
);

CREATE TABLE IF NOT EXISTS video_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id   UUID REFERENCES videos(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  content    TEXT NOT NULL,
  approved   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE videos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_videos" ON videos FOR SELECT USING (published = TRUE);
CREATE POLICY "public_insert_reactions"       ON video_reactions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "public_select_reactions"       ON video_reactions FOR SELECT USING (TRUE);
CREATE POLICY "public_insert_comments"        ON video_comments  FOR INSERT WITH CHECK (
  length(trim(author)) >= 2 AND length(trim(content)) >= 3 AND length(content) <= 500
);
CREATE POLICY "public_read_approved_comments" ON video_comments  FOR SELECT USING (approved = TRUE);

-- Storage bucket videos (à créer manuellement dans Supabase Dashboard > Storage)
-- Bucket name: videos, Public: true
-- Bucket name: video-thumbnails, Public: true
