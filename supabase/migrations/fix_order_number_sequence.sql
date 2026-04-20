-- ============================================================
-- Fix: order_number race condition → séquence atomique
-- Coller dans Supabase SQL Editor et exécuter
-- ============================================================

-- 1. Créer une vraie séquence PostgreSQL
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- 2. Initialiser la séquence à partir du max existant (évite les doublons avec l'existant)
SELECT setval('order_number_seq', COALESCE((
  SELECT MAX(CAST(order_number AS BIGINT))
  FROM orders
  WHERE order_number ~ '^[0-9]+$'
), 0));

-- 3. Fonction RPC appelée depuis le code Next.js
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT nextval('order_number_seq');
$$;

-- 4. Vérification
SELECT next_order_number(); -- doit retourner le prochain numéro
