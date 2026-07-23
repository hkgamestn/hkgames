-- ============================================================================
-- HK GAMES — Fidélité client + blocage « Retour recu » + statut colis fiable
-- ----------------------------------------------------------------------------
-- Idempotent : réexécutable sans risque. À coller dans le SQL Editor Supabase
-- (projet hk-games) si non appliqué via la CI.
--
-- Contexte : les statuts colis sont synchronisés depuis Navex (/api/admin/sync-navex).
--   • On détecte les clients LIVRÉS qui recommandent (même téléphone) -> badge Fidèle.
--   • On BLOQUE les clients dont un colis est revenu avec l'état « Retour recu »
--     (COD non honoré, client injoignable/refus) jusqu'à régularisation par téléphone.
-- ============================================================================

-- ── 1. Statut 'returned' autorisé ──────────────────────────────────────────
-- Le sync Navex tentait déjà de passer status='returned', mais la contrainte le
-- rejetait -> UPDATE en échec silencieux : les colis « Retour recu » restaient
-- coincés en 'shipped' et l'event Meta « Retour » se re-déclenchait à chaque sync.
-- On élargit la contrainte (surensemble : aucune ligne existante n'est invalidée).
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'pending','confirmed','on_hold','shipped','delivered','cancelled','returned'
  ]));

-- ── 2. Traçabilité de la réception du retour ───────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS returned_received_at TIMESTAMPTZ;

-- ── 3. Normalisation d'un numéro tunisien -> 8 chiffres locaux ─────────────
-- '+21621660303', '0021621660303', '21660303', '21 660 303' -> '21660303'.
-- Deux numéros locaux distincts ne peuvent pas collisionner (8 chiffres = le
-- numéro complet), donc c'est une clé d'identité client fiable.
CREATE OR REPLACE FUNCTION hk_normalize_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT RIGHT(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 8);
$$;

-- ── 4. Prédicat « Retour recu » (retour définitif encaissé par l'expéditeur) ─
-- Matche UNIQUEMENT « Retour recu » (accents / casse / espaces neutralisés).
-- Exclut « Retour Expediteur » (en transit retour) et « Rtn depot ».
CREATE OR REPLACE FUNCTION hk_is_retour_recu(p_etat TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT p_etat IS NOT NULL
     AND translate(lower(p_etat), 'éèêëàâäçîïôöûù', 'eeeeaaaciioouu') LIKE '%retour%'
     AND translate(lower(p_etat), 'éèêëàâäçîïôöûù', 'eeeeaaaciioouu') LIKE '%recu%';
$$;

-- ── 5. Prédicat « livré » (status métier OU état livreur Livrer/Livrer Paye) ─
CREATE OR REPLACE FUNCTION hk_is_delivered(p_status TEXT, p_etat TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT p_status = 'delivered'
      OR (p_etat IS NOT NULL AND lower(p_etat) LIKE '%livr%');
$$;

-- ── 6. Overrides manuels (déblocage après contact client au +216 21 660 303) ─
CREATE TABLE IF NOT EXISTS customer_flags (
  phone       TEXT PRIMARY KEY,               -- 8 chiffres normalisés
  force_block BOOLEAN NOT NULL DEFAULT false,  -- bloquer manuellement
  force_allow BOOLEAN NOT NULL DEFAULT false,  -- débloquer (prioritaire)
  note        TEXT,
  updated_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customer_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_flags_admin_all ON customer_flags;
CREATE POLICY customer_flags_admin_all ON customer_flags
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── 7. Vue réputation client (un agrégat par téléphone normalisé) ──────────
-- security_invoker : respecte la RLS de `orders` du rôle appelant
-- (admin authentifié = lecture complète ; anon = rien).
CREATE OR REPLACE VIEW hk_customer_reputation_view
WITH (security_invoker = true) AS
WITH agg AS (
  SELECT
    hk_normalize_phone(customer_phone)                                                  AS phone,
    count(*) FILTER (WHERE deleted_at IS NULL)                                           AS total_orders,
    count(*) FILTER (WHERE deleted_at IS NULL AND hk_is_delivered(status, navex_etat))   AS delivered_count,
    count(*) FILTER (WHERE deleted_at IS NULL AND hk_is_retour_recu(navex_etat))         AS returned_received_count,
    max(created_at) FILTER (WHERE hk_is_delivered(status, navex_etat))                   AS last_delivered_at,
    max(COALESCE(navex_etat_at, updated_at))
        FILTER (WHERE hk_is_retour_recu(navex_etat))                                     AS last_returned_at
  FROM orders
  WHERE hk_normalize_phone(customer_phone) <> ''
  GROUP BY hk_normalize_phone(customer_phone)
)
SELECT
  a.phone,
  a.total_orders,
  a.delivered_count,
  a.returned_received_count,
  a.last_delivered_at,
  a.last_returned_at,
  (a.delivered_count > 0)                                    AS is_loyal,
  CASE
    WHEN COALESCE(f.force_allow, false) THEN false           -- déblocage manuel prioritaire
    WHEN COALESCE(f.force_block, false) THEN true            -- blocage manuel
    ELSE a.returned_received_count > 0                       -- règle auto : « Retour recu »
  END                                                        AS is_blocked
FROM agg a
LEFT JOIN customer_flags f ON f.phone = a.phone;

GRANT SELECT ON hk_customer_reputation_view TO authenticated, service_role;

-- ── 8. Réputation d'un téléphone unique (appelée au checkout) ──────────────
-- SECURITY DEFINER : calcule côté serveur sans exposer la table orders.
CREATE OR REPLACE FUNCTION hk_customer_reputation(p_phone TEXT)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH n AS (SELECT hk_normalize_phone(p_phone) AS phone)
  SELECT jsonb_build_object(
    'phone',                   n.phone,
    'is_loyal',                COALESCE(v.is_loyal, false),
    'is_blocked',              COALESCE(v.is_blocked, false),
    'total_orders',            COALESCE(v.total_orders, 0),
    'delivered_count',         COALESCE(v.delivered_count, 0),
    'returned_received_count', COALESCE(v.returned_received_count, 0),
    'last_delivered_at',       v.last_delivered_at,
    'last_returned_at',        v.last_returned_at
  )
  FROM n
  LEFT JOIN hk_customer_reputation_view v ON v.phone = n.phone;
$$;

REVOKE ALL ON FUNCTION hk_customer_reputation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hk_customer_reputation(TEXT) TO service_role, authenticated;

-- ── 9. Index d'appoint pour la recherche par téléphone ─────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_phone_norm
  ON orders (hk_normalize_phone(customer_phone));
