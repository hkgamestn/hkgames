-- ============================================================
-- HK Games — Prospection Grossistes (OUTBOUND / CRM)
-- Distinct de wholesale_requests (inbound depuis la page publique).
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS wholesale_prospects (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enseigne        TEXT NOT NULL,
  segment         TEXT DEFAULT 'grossiste'
                  CHECK (segment IN ('grossiste','magasin','papeterie','e-shop','fete','autre')),
  gouvernorat     TEXT,
  ville           TEXT,
  email           TEXT,
  whatsapp        TEXT,
  source          TEXT DEFAULT 'terrain'
                  CHECK (source IN ('pages_maghreb','kompass','europages','goafrica','terrain','facebook','inbound_site')),
  stage           TEXT DEFAULT 'a_contacter'
                  CHECK (stage IN ('a_contacter','contacte','interesse','catalogue','devis','client','inactif')),
  opt_out         BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  last_contact_at TIMESTAMPTZ,
  request_id      UUID REFERENCES wholesale_requests(id) ON DELETE SET NULL, -- si converti depuis un lead inbound
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_stage       ON wholesale_prospects (stage);
CREATE INDEX IF NOT EXISTS idx_prospects_gouvernorat ON wholesale_prospects (gouvernorat);

-- updated_at auto
CREATE OR REPLACE FUNCTION touch_prospect_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_prospects_updated ON wholesale_prospects;
CREATE TRIGGER trg_prospects_updated
  BEFORE UPDATE ON wholesale_prospects
  FOR EACH ROW EXECUTE FUNCTION touch_prospect_updated_at();

-- RLS : table 100% admin (utilisateur authentifié). Le service role bypasse.
ALTER TABLE wholesale_prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_prospects" ON wholesale_prospects;
CREATE POLICY "admin_all_prospects"
  ON wholesale_prospects FOR ALL
  TO authenticated
  USING (TRUE) WITH CHECK (TRUE);
