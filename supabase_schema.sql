-- 1. Enums
CREATE TYPE reservation_type AS ENUM ('FIELD', 'EVENT', 'TABLES_ONLY');
CREATE TYPE reservation_status AS ENUM ('HOLD', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
CREATE TYPE resource_type AS ENUM ('FIELD', 'TABLE_ROW');
CREATE TYPE payment_provider AS ENUM ('YAPPY');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE user_role AS ENUM ('CLIENT', 'ADMIN');

-- 2. Profiles (Roles)
-- 2. Profiles (Roles)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'CLIENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'CLIENT'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Resources
CREATE TABLE public.resources (
  id TEXT PRIMARY KEY, -- 'field_a', 'tables_row_1'
  type resource_type NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 1, -- Canchas = 1, Mesas = N
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reservations
CREATE TABLE public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type reservation_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status reservation_status DEFAULT 'HOLD',
  hold_expires_at TIMESTAMPTZ,
  total_amount NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL,
  customer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reservation Resources (Many-to-Many)
CREATE TABLE public.reservation_resources (
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES public.resources(id),
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY (reservation_id, resource_id)
);

-- 6. Payments
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id),
  provider payment_provider DEFAULT 'YAPPY',
  provider_transaction_id TEXT, -- Yappy Order ID / Token
  amount NUMERIC(10,2) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 7. Indexes
CREATE INDEX idx_reservations_range ON public.reservations USING GIST (tstzrange(start_time, end_time));
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);

-- 8. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 9. Policies

-- Profiles: Read own, Admin read all
CREATE POLICY "Users rely own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Resources: Public Read, Admin Write
CREATE POLICY "Public read resources" ON public.resources FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin write resources" ON public.resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Reservations:
-- Own rows: Read Only
CREATE POLICY "Users read own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
-- Clients cannot INSERT/UPDATE. Backend (Service Role) handles creation/updates.

-- Admin read/write all (Admin User Context - optional, usually Admin Panel might read directly)
-- But if strict, Admin Panel should also use endpoints?
-- User said: "Los clientes NO deben escribir directo". "Admin no debe poder UPDATE/INSERT payments".
-- For Reservations, Admin might need to Cancel (UPDATE status).
-- Code uses /api/admin/reservations/[id]/cancel -> uses createAdminClient() (Service Role).
-- So Admin User Context doesn't strictly need Write access if UI calls API.
-- BUT, "Admin all reservations" allows ALL.
-- While user didn't explicitly forbid Admin User Context on Reservations (only Payments),
-- sticking to "Least Privilege" implies we might restrict this too if UI uses API.
-- However, user instruction #4 was specific to "Pagos".
-- Instruction #2 says "Los clientes NO deben escribir...".
-- Let's keep Admin access on Reservations flexible for now unless strict parity requested.
CREATE POLICY "Admin all reservations" ON public.reservations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Reservation Resources:
CREATE POLICY "Read linked resources" ON public.reservation_resources FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND (r.user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  ))
);

-- Payments
CREATE POLICY "Read own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.user_id = auth.uid())
);
-- Admin READ ONLY on Payments (Writes via Service Role / Webhook only)
CREATE POLICY "Admin read payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 10. Seed Data
INSERT INTO public.resources (id, type, name, capacity) VALUES
('field_a', 'FIELD', 'Cancha A', 1),
('field_b', 'FIELD', 'Cancha B', 1),
('tables_row_1', 'TABLE_ROW', 'Mesas Fila 1', 8),
('tables_row_2', 'TABLE_ROW', 'Mesas Fila 2', 8)
ON CONFLICT (id) DO NOTHING;
