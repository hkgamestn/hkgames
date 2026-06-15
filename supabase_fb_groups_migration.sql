-- HK Games — Groupes Facebook B2C (organique)
-- Pilote le workflow de publication : où poster, quoi, quand (cadence anti-ban).
-- NB : pas de publication auto (interdit par Facebook) — le dashboard cadence + ouvre le groupe + journalise.

CREATE TABLE IF NOT EXISTS fb_groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT,
  category    TEXT NOT NULL DEFAULT 'parents'
              CHECK (category IN ('parents','marketplace','b2b','autre')),
  audience    TEXT,                              -- note audience (taille/qualité estimée)
  status      TEXT NOT NULL DEFAULT 'a_rejoindre'
              CHECK (status IN ('a_rejoindre','en_attente','rejoint','refuse')),
  rules_note  TEXT,                              -- règles du groupe (pub autorisée ? jours ?)
  cadence_days INT NOT NULL DEFAULT 4,           -- intervalle mini entre 2 posts (anti-ban)
  last_post_at TIMESTAMPTZ,
  post_count  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fb_groups_category ON fb_groups (category);
CREATE INDEX IF NOT EXISTS idx_fb_groups_status   ON fb_groups (status);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fb_groups_updated ON fb_groups;
CREATE TRIGGER trg_fb_groups_updated BEFORE UPDATE ON fb_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE fb_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_fb_groups" ON fb_groups;
CREATE POLICY "admin_all_fb_groups" ON fb_groups FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Seed des groupes réels (uniquement si la table est vide) --------------------
INSERT INTO fb_groups (name, url, category, audience, rules_note)
SELECT * FROM (VALUES
  ('Bons Plans Famille-Tunisie (Les enfants d''abord)', 'https://www.facebook.com/groups/Bonsplansfamille.tn/', 'parents', 'Familles + enfants + bons plans — cœur de cible', 'Lire les règles épinglées avant 1er post'),
  ('Baby Troc', 'https://www.facebook.com/babytroctunis/', 'parents', '~53k — échange entre mamans, enfant 0-12 ans', 'Page/communauté — vérifier règles'),
  ('La Bulle des Mamans', 'https://www.facebook.com/preparation.accouchement/', 'parents', '~20k — futures et jeunes mamans, Grand Tunis', NULL),
  ('Bébé et maman', 'https://www.facebook.com/bebeetmamanshop/', 'parents', '~540k — très large audience parents', NULL),
  ('BEBE AU TOP', 'https://www.facebook.com/BebeAuTop/', 'parents', 'Acheter/vendre/troquer jouets + puériculture', NULL),
  ('MOOM Family', 'https://moom.family/', 'parents', 'Média parental Tunisie — contenu/partenariat', NULL),
  ('Bon Plan Tunisie', 'https://www.facebook.com/groups/695435330847944/', 'marketplace', 'Bons plans généralistes', NULL),
  ('Les bons plans de Tunisie: The First', 'https://www.facebook.com/groups/lesplandeTunis/', 'marketplace', 'Généraliste', NULL),
  ('Les bons plans de Tunis', 'https://www.facebook.com/groups/1681758655420990/', 'marketplace', 'Grand Tunis', NULL),
  ('Achat et vente Tunisie annonces', 'https://www.facebook.com/groups/PNtunisie/', 'marketplace', 'Petites annonces', NULL),
  ('Marketplace Tunisie tn', 'https://www.facebook.com/groups/marketplacetunisie/', 'marketplace', 'Marketplace généraliste', NULL),
  ('Vide Dressing En Tunisie', 'https://www.facebook.com/groups/2301208943447087/', 'marketplace', 'Vide-dressing / occasions', NULL),
  ('Vente En Gros En Tunisie 🇹🇳', 'https://www.facebook.com/groups/venteentunisie/', 'b2b', 'Acheteurs en gros = revendeurs potentiels', 'Pour la prospection grossistes')
) AS v(name, url, category, audience, rules_note)
WHERE NOT EXISTS (SELECT 1 FROM fb_groups);
