-- Ensure public can read active products (fixes "0 slimes" for some users)
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT USING (is_active = true);

-- Make sure RLS is enabled but allows public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
