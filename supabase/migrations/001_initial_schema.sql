-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- HK GAMES SLIME STORE — Database Schema v1
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- PRODUCTS
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  line           TEXT NOT NULL CHECK (line IN ('unicolore','bicolore','buddies')),
  price_dt       NUMERIC(10,3) NOT NULL,
  images         TEXT[],
  colors         JSONB,
  bicolor_combos JSONB,
  is_active      BOOLEAN DEFAULT true,
  position       INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','on_hold','shipped','delivered','cancelled')),

  customer_name    TEXT,
  customer_phone   TEXT NOT NULL,
  customer_address TEXT,
  customer_city    TEXT,
  customer_notes   TEXT,

  items            JSONB NOT NULL DEFAULT '[]',
  subtotal_dt      NUMERIC(10,3),
  shipping_dt      NUMERIC(10,3) DEFAULT 8,
  discount_dt      NUMERIC(10,3) DEFAULT 0,
  total_dt         NUMERIC(10,3),
  bundle_type      TEXT,

  navex_tracking   TEXT,
  navex_parcel_id  TEXT,

  oto_shown        BOOLEAN DEFAULT false,
  oto_accepted     BOOLEAN DEFAULT false,

  cancellation_reason TEXT,
  admin_notes      TEXT,

  source           TEXT,
  deleted_at       TIMESTAMPTZ,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER LOGS
CREATE TABLE order_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  old_value  JSONB,
  new_value  JSONB,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY LOGS
CREATE TABLE inventory_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color      TEXT,
  delta      INTEGER NOT NULL,
  reason     TEXT CHECK (reason IN ('order','restock','manual','cancelled')),
  order_id   UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TESTIMONIALS
CREATE TABLE testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_city TEXT,
  product_id    UUID REFERENCES products(id),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text   TEXT NOT NULL,
  photo_url     TEXT,
  is_approved   BOOLEAN DEFAULT false,
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value, description) VALUES
  ('free_shipping_threshold_dt', '50',    'Seuil livraison gratuite en DT'),
  ('shipping_price_dt',          '8',     'Prix livraison standard'),
  ('shipping_timer_cutoff',      '18:00', 'Heure limite pour livraison J+1'),
  ('stock_alert_threshold',      '5',     'Stock min avant badge orange'),
  ('oto_product_id',             '',      'UUID produit proposé en OTO'),
  ('oto_discount_dt',            '6',     'Réduction OTO en DT'),
  ('oto_enabled',                'true',  'Activer/désactiver OTO'),
  ('bundle_decouverte_enabled',  'true',  'Bundle Découverte actif'),
  ('bundle_alchimiste_enabled',  'true',  'Bundle Alchimiste actif'),
  ('bundle_famille_enabled',     'true',  'Bundle Famille Monstre actif');

-- PUSH SUBSCRIPTIONS
CREATE TABLE push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription JSONB NOT NULL,
  device_name  TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- UPSELL EVENTS
CREATE TABLE upsell_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id),
  type       TEXT NOT NULL CHECK (type IN ('oto_shown','oto_accepted','oto_declined')),
  product_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WAITLIST
CREATE TABLE waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  color      TEXT,
  phone      TEXT NOT NULL,
  notified   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_admin_all"   ON products FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_public_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_all"     ON orders FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials_public_select" ON testimonials FOR SELECT USING (is_approved = true);
CREATE POLICY "testimonials_public_insert" ON testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "testimonials_admin_all"     ON testimonials FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_select" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update"  ON settings FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_admin_all" ON push_subscriptions FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_public_insert" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "waitlist_admin_all"     ON waitlist FOR ALL USING (auth.role() = 'authenticated');

-- Realtime
ALTER TABLE orders   REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_color TEXT, p_qty INTEGER)
RETURNS void AS $$
DECLARE
  v_colors JSONB;
  v_new_colors JSONB;
BEGIN
  SELECT colors INTO v_colors FROM products WHERE id = p_product_id FOR UPDATE;
  v_new_colors := (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'name' = p_color
        THEN jsonb_set(elem, '{stock}', (GREATEST(0, (elem->>'stock')::int - p_qty))::text::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(v_colors) AS elem
  );
  UPDATE products SET colors = v_new_colors, updated_at = NOW() WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SEED DATA — Produits initiaux
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO products (slug, name, description, line, price_dt, position, colors) VALUES
('unicolore-rouge',  'Slime Unicolore Rouge',  'Slime artisanal unicolore 170g — Non-toxique certifié', 'unicolore', 12.000, 1,
  '[{"name":"Rouge","hex":"#ef4444","stock":20},{"name":"Bleu","hex":"#3b82f6","stock":20},{"name":"Jaune","hex":"#eab308","stock":15},{"name":"Vert","hex":"#22c55e","stock":18},{"name":"Rose","hex":"#ec4899","stock":22},{"name":"Violet","hex":"#a855f7","stock":25}]'),

('bicolore-rose-bleu', 'Slime Bicolore', 'Mélangez deux couleurs pour créer votre couleur secrète ! 170g', 'bicolore', 15.000, 2,
  '[{"name":"Rose","hex":"#ec4899","stock":30},{"name":"Bleu","hex":"#3b82f6","stock":30},{"name":"Jaune","hex":"#eab308","stock":25}]'),

('buddies-violet', 'Slime Buddy', 'Votre monstre de slime personnel avec yeux mobiles inclus ! 170g', 'buddies', 18.000, 3,
  '[{"name":"Rouge","hex":"#ef4444","stock":15},{"name":"Bleu","hex":"#3b82f6","stock":15},{"name":"Jaune","hex":"#eab308","stock":10},{"name":"Vert","hex":"#22c55e","stock":12},{"name":"Rose","hex":"#ec4899","stock":18},{"name":"Violet","hex":"#a855f7","stock":20}]');
