-- ============================================================================
-- HK GAMES — Badge fidèle PAR COMMANDE : expose first_delivered_at
-- ----------------------------------------------------------------------------
-- Le badge ⭐ ne doit marquer que les commandes passées APRÈS une première
-- livraison du même téléphone (la 1ère commande livrée n'a pas de badge ;
-- la commande suivante = « ce client a déjà commandé avant »).
-- CREATE OR REPLACE VIEW : colonnes existantes inchangées, ajout en fin.
-- ============================================================================

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
                         NOT IN ('Stock insuffisant','Double commande'))                 AS cancelled_count,
    min(created_at) FILTER (WHERE deleted_at IS NULL
                            AND hk_is_delivered(status, navex_etat))                     AS first_delivered_at
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
  a.cancelled_count,
  a.first_delivered_at
FROM agg a
LEFT JOIN customer_flags f ON f.phone = a.phone;

GRANT SELECT ON hk_customer_reputation_view TO authenticated, service_role;
