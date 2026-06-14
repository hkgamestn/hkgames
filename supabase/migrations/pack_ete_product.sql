-- ============================================================
-- HK Games — Pack Été (6 couleurs, livraison gratuite)
-- Coller dans Supabase SQL Editor et exécuter
-- ============================================================

-- 1. Insérer le produit Pack Été
INSERT INTO products (
  name,
  slug,
  line,
  price_dt,
  description,
  is_active,
  stock,
  colors,
  images
) VALUES (
  'Pack Été — 6 Slimes',
  'pack-ete-6-slimes',
  'pack_ete',
  60,
  'Profite de l''offre d''été : 5 slimes unicolores + 1 offert = 6 pots ! Rose, Rouge, Orange, Vert, Violet & Jaune. Livraison gratuite incluse.',
  true,
  50,
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  price_dt   = EXCLUDED.price_dt,
  is_active  = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Vérification
SELECT id, name, slug, line, price_dt, is_active FROM products WHERE line = 'pack_ete';
