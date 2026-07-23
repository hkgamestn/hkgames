-- ============================================================================
-- HK GAMES — Élargit le blocage client : injoignable (on_hold) + annulé (cancelled)
-- ----------------------------------------------------------------------------
-- Idempotent (CREATE OR REPLACE). S'appuie sur 002_customer_reputation.sql.
--
-- Règle de blocage (auto) = au moins un des cas :
--   • navex_etat « Retour recu »           (colis revenu, COD non honoré)
--   • status = 'on_hold'                    (client injoignable à la vérification)
--   • status = 'cancelled' SAUF raison interne (« Stock insuffisant » / « Double
--     commande ») — on ne bloque JAMAIS un client pour une annulation de NOTRE fait.
-- L'override manuel `customer_flags.force_allow` reste prioritaire (déblocage).
-- ============================================================================

-- On garde l'ordre des 8 colonnes existantes (contrainte CREATE OR REPLACE VIEW)
-- et on ajoute on_hold_count / cancelled_count à la fin.
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
        FILTER (WHERE hk_is_retour_recu(navex_etat))                                     AS last_returned_at,
    count(*) FILTER (WHERE deleted_at IS NULL AND status = 'on_hold')                    AS on_hold_count,
    count(*) FILTER (WHERE deleted_at IS NULL AND status = 'cancelled'
                     AND COALESCE(cancellation_reason,'')
                         NOT IN ('Stock insuffisant','Double commande'))                 AS cancelled_count
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
    ELSE (a.returned_received_count > 0
          OR a.on_hold_count > 0
          OR a.cancelled_count > 0)                          -- règles auto
  END                                                        AS is_blocked,
  a.on_hold_count,
  a.cancelled_count
FROM agg a
LEFT JOIN customer_flags f ON f.phone = a.phone;

GRANT SELECT ON hk_customer_reputation_view TO authenticated, service_role;

-- RPC checkout : on expose aussi les nouveaux compteurs (transparence / debug).
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
    'on_hold_count',           COALESCE(v.on_hold_count, 0),
    'cancelled_count',         COALESCE(v.cancelled_count, 0),
    'last_delivered_at',       v.last_delivered_at,
    'last_returned_at',        v.last_returned_at
  )
  FROM n
  LEFT JOIN hk_customer_reputation_view v ON v.phone = n.phone;
$$;

REVOKE ALL ON FUNCTION hk_customer_reputation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hk_customer_reputation(TEXT) TO service_role, authenticated;
