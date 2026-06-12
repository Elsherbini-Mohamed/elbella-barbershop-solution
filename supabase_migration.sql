-- ═══════════════════════════════════════════════════════════════
-- MIGRAZIONE ELBELLA — esegui in Supabase: SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- 1. Colonne mancanti sulla tabella products
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 19.90;
ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Popola image_url dei prodotti usando la prima immagine disponibile
UPDATE products p
SET image_url = (
  SELECT COALESCE(pi.storage_url, pi.remote_url)
  FROM product_images pi
  WHERE pi.product_id = p.id
  ORDER BY pi.created_at ASC
  LIMIT 1
)
WHERE p.image_url IS NULL;

-- 2. Tabella orders (quella che manca!)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  items JSONB NOT NULL DEFAULT '[]',
  stripe_session_id TEXT UNIQUE NOT NULL
);

-- Indice per la ricerca veloce per sessione Stripe (dedup)
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- 3. Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Solo il service_role (server) può scrivere ordini;
-- gli utenti autenticati (admin) possono leggerli e aggiornarli
DROP POLICY IF EXISTS "service_role_all_orders" ON orders;
CREATE POLICY "service_role_all_orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_orders" ON orders;
CREATE POLICY "authenticated_read_orders" ON orders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_orders" ON orders;
CREATE POLICY "authenticated_update_orders" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. RLS sulla tabella products: lettura pubblica, scrittura solo autenticati
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_write_products" ON products;
CREATE POLICY "authenticated_write_products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_products" ON products;
CREATE POLICY "service_role_all_products" ON products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. RLS su categories e product_images: lettura pubblica
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images
  FOR SELECT TO anon, authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- Verifica finale: esegui per controllare
-- ═══════════════════════════════════════════════════════════════
SELECT
  (SELECT COUNT(*) FROM products WHERE price IS NOT NULL) AS prodotti_con_prezzo,
  (SELECT COUNT(*) FROM products WHERE image_url IS NOT NULL) AS prodotti_con_immagine,
  (SELECT COUNT(*) FROM orders) AS ordini;
