-- ============================================================
-- HK Games — Prospection AUTOMATIQUE & INTELLIGENTE (v2)
-- Étend wholesale_prospects : séquences + scoring + journal.
-- À exécuter après supabase_wholesale_prospects_migration.sql
-- ============================================================

-- 1. Champs séquence / scoring sur les prospects
ALTER TABLE wholesale_prospects
  ADD COLUMN IF NOT EXISTS sequence_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sequence_step   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_action_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS score           INT DEFAULT 0,        -- 0..100 (priorité)
  ADD COLUMN IF NOT EXISTS replied_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prospects_next_action ON wholesale_prospects (next_action_at)
  WHERE sequence_active = TRUE;

-- 2. Étapes de séquence (cadence éditable depuis l'admin)
CREATE TABLE IF NOT EXISTS prospect_sequence_steps (
  id         SERIAL PRIMARY KEY,
  step_order INT  NOT NULL,
  channel    TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  delay_days INT  NOT NULL DEFAULT 0,   -- délai depuis l'étape précédente
  subject    TEXT,                      -- email seulement
  body       TEXT NOT NULL,             -- variables: {enseigne} {ville} {gouvernorat}
  active     BOOLEAN DEFAULT TRUE
);

INSERT INTO prospect_sequence_steps (step_order, channel, delay_days, subject, body) VALUES
  (1, 'email', 0, 'Slime premium fabriqué en Tunisie — pour vos rayons',
   'Bonjour {enseigne}, je suis [Prénom] de HK Games (slime premium SLIMO, fabriqué en Tunisie). Produit à forte rotation, marges revendeur intéressantes, réassort rapide. Catalogue + tarifs gros ou un échantillon pour {ville} ?'),
  (2, 'email', 3, 'Re: un échantillon pour {enseigne} ?',
   'Petit rappel 🙂 Le slime SLIMO tourne très bien en rayon. Je peux vous envoyer un échantillon gratuit + la grille de prix gros. Intéressé pour {ville} ?'),
  (3, 'whatsapp', 5, NULL,
   'سلام {enseigne} 👋 أنا [الإسم] من HK Games، سلايم تونسي بريميوم. نحب نعرضلك الكتالوڭ والأسعار بالجملة، تحب؟')
ON CONFLICT DO NOTHING;

-- 3. Journal des messages (envoyés / à envoyer / répondus)
CREATE TABLE IF NOT EXISTS prospect_messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id  UUID REFERENCES wholesale_prospects(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  step         INT,
  subject      TEXT,
  body         TEXT,
  status       TEXT DEFAULT 'queued'
               CHECK (status IN ('queued','sent','manual_pending','failed','replied')),
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  sent_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_messages_prospect ON prospect_messages (prospect_id);
CREATE INDEX IF NOT EXISTS idx_messages_status   ON prospect_messages (status);

-- 4. RLS (admin authentifié ; service role bypasse pour le séquenceur)
ALTER TABLE prospect_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_messages       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_seq_steps" ON prospect_sequence_steps;
CREATE POLICY "admin_all_seq_steps" ON prospect_sequence_steps FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "admin_all_messages" ON prospect_messages;
CREATE POLICY "admin_all_messages" ON prospect_messages FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
