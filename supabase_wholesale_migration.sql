-- ============================================================
-- HK Games — Migration Vente en Gros + Facturation
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Paliers de prix grossiste (configurables depuis admin)
CREATE TABLE IF NOT EXISTS wholesale_tiers (
  id         SERIAL PRIMARY KEY,
  label      TEXT NOT NULL,
  min_qty    INT  NOT NULL CHECK (min_qty > 0),
  max_qty    INT,           -- NULL = illimité
  price_ht   NUMERIC(10,3) NOT NULL CHECK (price_ht > 0),
  sort_order INT DEFAULT 0,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales
INSERT INTO wholesale_tiers (label, min_qty, max_qty, price_ht, sort_order) VALUES
  ('Démarrage',    10,  19,  12.000, 1),
  ('Standard',     20,  49,  10.500, 2),
  ('Pro',          50,  99,   9.000, 3),
  ('Partenaire',  100, NULL,  7.500, 4);

-- 2. Demandes grossiste
CREATE TABLE IF NOT EXISTS wholesale_requests (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name       TEXT NOT NULL,
  contact_name       TEXT NOT NULL,
  phone              TEXT NOT NULL,
  email              TEXT,
  city               TEXT NOT NULL,
  address            TEXT NOT NULL,
  matricule_fiscal   TEXT NOT NULL,
  estimated_qty      INT,
  products_wanted    TEXT,
  notes              TEXT,
  status             TEXT DEFAULT 'new'
                     CHECK (status IN ('new','contacted','confirmed','cancelled')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Séquence pour numéros de facture
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT LANGUAGE SQL AS $$
  SELECT 'FAC-' || EXTRACT(YEAR FROM NOW())::TEXT
      || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
$$;

-- 4. Factures grossiste
CREATE TABLE IF NOT EXISTS wholesale_invoices (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number   TEXT UNIQUE NOT NULL DEFAULT next_invoice_number(),
  request_id       UUID REFERENCES wholesale_requests(id) ON DELETE SET NULL,
  -- Snapshot client
  company_name     TEXT NOT NULL,
  contact_name     TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  address          TEXT NOT NULL,
  city             TEXT NOT NULL,
  matricule_fiscal TEXT NOT NULL,
  -- Lignes
  items            JSONB NOT NULL DEFAULT '[]',
  -- Totaux
  total_ht         NUMERIC(10,3) NOT NULL DEFAULT 0,
  tva_rate         NUMERIC(5,2)  NOT NULL DEFAULT 19.00,
  tva_amount       NUMERIC(10,3) NOT NULL DEFAULT 0,
  timbre           NUMERIC(10,3) NOT NULL DEFAULT 1.000,
  total_ttc        NUMERIC(10,3) NOT NULL DEFAULT 0,
  -- État
  status           TEXT DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS — public peut insérer des demandes, admin lit tout
ALTER TABLE wholesale_tiers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_invoices  ENABLE ROW LEVEL SECURITY;

-- Paliers : lecture publique
CREATE POLICY "public_read_tiers"
  ON wholesale_tiers FOR SELECT USING (active = TRUE);

-- Demandes : insertion publique, lecture admin seulement
CREATE POLICY "public_insert_requests"
  ON wholesale_requests FOR INSERT WITH CHECK (TRUE);

-- Service role bypasse tout RLS automatiquement pour l'admin
