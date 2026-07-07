-- 1. Table des Réservations
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(100) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guests INT NOT NULL CHECK (guests > 0),
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, attended
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pour accélérer les requêtes par date
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- 2. Configuration RLS (Row Level Security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Les administrateurs connectés via Supabase Auth peuvent tout lire
CREATE POLICY "Les administrateurs peuvent voir les réservations" 
ON bookings FOR SELECT 
TO authenticated 
USING (true);

-- Les administrateurs peuvent modifier les réservations
CREATE POLICY "Les administrateurs peuvent modifier les réservations" 
ON bookings FOR UPDATE 
TO authenticated 
USING (true);

-- L'API via le Service Role Key (backend Next.js) bypasse RLS automatiquement 
-- pour l'insertion des réservations des clients (pas besoin de policy INSERT publique).

-- 3. Table du Menu
CREATE TABLE IF NOT EXISTS restaurant_menu (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insérer une ligne initiale par défaut pour le menu (id = 1)
INSERT INTO restaurant_menu (id, data) 
VALUES (1, '{"mode": "interactive", "categories": []}')
ON CONFLICT (id) DO NOTHING;
