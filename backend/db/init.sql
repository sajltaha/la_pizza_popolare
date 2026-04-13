CREATE TABLE IF NOT EXISTS pizzas (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  toppings TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL,
  img TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  promo_code TEXT,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pizza_id INTEGER NOT NULL REFERENCES pizzas(id),
  pizza_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
