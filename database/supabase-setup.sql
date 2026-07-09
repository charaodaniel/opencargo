-- ═══════════════════════════════════════════════════════════
-- OpenCargo — Supabase Setup (Auth-Compatible)
-- ═══════════════════════════════════════════════════════════
--
-- Execute este script no SQL Editor do Supabase Dashboard
-- (https://supabase.com/dashboard/project/irznvnpaetvkuvmdrgoo/sql/new)
--
-- Este script:
--   1. Cria as tabelas do OpenCargo com FK para auth.users
--   2. Ativa Row Level Security (RLS) em todas as tabelas
--   3. Cria políticas de acesso por role
--   4. Cria trigger handle_new_user() para sync automático
--   5. Insere dados de exemplo
--
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. EXTENSÕES
-- ═══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════
-- 2. TABELAS
-- ═══════════════════════════════════════════════════════════
--
-- ⚠️  users.id NÃO usa uuid_generate_v4() — ele usa o UUID
--     do auth.users do Supabase via REFERENCES.
--     O trigger handle_new_user() (seção 4) cria o registro
--     automaticamente quando alguém se cadastra.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'motorista'
    CHECK(role IN ('administrador', 'gestor', 'empresa', 'motorista')),
  phone VARCHAR(20),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Remove role CHECK antigo (só roda se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL UNIQUE,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL UNIQUE,
  cnh VARCHAR(20),
  phone VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(2),
  available INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  plate VARCHAR(10) NOT NULL UNIQUE,
  model VARCHAR(255) NOT NULL,
  year INTEGER,
  capacity_kg REAL NOT NULL,
  capacity_m3 REAL NOT NULL,
  type VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  origin_city VARCHAR(100) NOT NULL,
  origin_state VARCHAR(2) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  destination_state VARCHAR(2) NOT NULL,
  departure_date DATE NOT NULL,
  arrival_date DATE NOT NULL,
  available_weight REAL,
  available_volume REAL,
  is_return INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK(status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  origin_city VARCHAR(100) NOT NULL,
  origin_state VARCHAR(2) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  destination_state VARCHAR(2) NOT NULL,
  weight_kg REAL NOT NULL,
  volume_m3 REAL,
  type VARCHAR(50),
  pickup_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'available', 'matched', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL
    CHECK(entity_type IN ('company', 'driver', 'vehicle', 'load', 'general')),
  entity_id UUID,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 3. ÍNDICES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
CREATE INDEX IF NOT EXISTS idx_loads_origin_dest ON loads(origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_loads_status   ON loads(status);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_routes_status  ON routes(status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_reviews_match  ON reviews(match_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);

-- ═══════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Helper: retorna o role do usuário logado
-- Lê do JWT (raw_user_meta_data) ou faz fallback na tabela users
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR(20)
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'user_metadata' ->> 'role',
    (SELECT role FROM public.users WHERE id = auth.uid())
  );
$$;

-- Helper: verifica se é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.current_user_role() = 'administrador';
$$;

-- Helper: verifica se é gestor ou admin
CREATE OR REPLACE FUNCTION public.is_gestor_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.current_user_role() IN ('administrador', 'gestor');
$$;

-- ─── 4.1 RLS: USERS ─────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS users_self ON users;
CREATE POLICY users_self ON users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── 4.2 RLS: COMPANIES ─────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_admin_all ON companies;
CREATE POLICY companies_admin_all ON companies
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS companies_gestor_all ON companies;
CREATE POLICY companies_gestor_all ON companies
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS companies_self ON companies;
CREATE POLICY companies_self ON companies
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS companies_driver_select ON companies;
CREATE POLICY companies_driver_select ON companies
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('motorista', 'empresa', 'gestor', 'administrador')
  ));

-- ─── 4.3 RLS: DRIVERS ───────────────────────────────────
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drivers_admin_all ON drivers;
CREATE POLICY drivers_admin_all ON drivers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS drivers_gestor_all ON drivers;
CREATE POLICY drivers_gestor_all ON drivers
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS drivers_self ON drivers;
CREATE POLICY drivers_self ON drivers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS drivers_company_select ON drivers;
CREATE POLICY drivers_company_select ON drivers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('empresa', 'motorista', 'gestor', 'administrador')
  ));

-- ─── 4.4 RLS: VEHICLES ──────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicles_admin_all ON vehicles;
CREATE POLICY vehicles_admin_all ON vehicles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS vehicles_gestor_all ON vehicles;
CREATE POLICY vehicles_gestor_all ON vehicles
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS vehicles_self ON vehicles;
CREATE POLICY vehicles_self ON vehicles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS vehicles_company_select ON vehicles;
CREATE POLICY vehicles_company_select ON vehicles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('empresa', 'motorista', 'gestor', 'administrador')
  ));

-- ─── 4.5 RLS: ROUTES ────────────────────────────────────
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routes_admin_all ON routes;
CREATE POLICY routes_admin_all ON routes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS routes_gestor_all ON routes;
CREATE POLICY routes_gestor_all ON routes
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS routes_self ON routes;
CREATE POLICY routes_self ON routes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM drivers WHERE id = routes.driver_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM drivers WHERE id = routes.driver_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS routes_company_select ON routes;
CREATE POLICY routes_company_select ON routes
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('empresa', 'motorista', 'gestor', 'administrador')
  ));

-- ─── 4.6 RLS: LOADS ─────────────────────────────────────
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loads_admin_all ON loads;
CREATE POLICY loads_admin_all ON loads
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS loads_gestor_all ON loads;
CREATE POLICY loads_gestor_all ON loads
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS loads_self ON loads;
CREATE POLICY loads_self ON loads
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM companies WHERE id = loads.company_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE id = loads.company_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS loads_driver_select ON loads;
CREATE POLICY loads_driver_select ON loads
  FOR SELECT
  USING (status = 'available' AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('motorista', 'empresa', 'gestor', 'administrador')
  ));

-- ─── 4.7 RLS: MATCHES ───────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS matches_admin_all ON matches;
CREATE POLICY matches_admin_all ON matches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS matches_gestor_all ON matches;
CREATE POLICY matches_gestor_all ON matches
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS matches_involved ON matches;
CREATE POLICY matches_involved ON matches
  FOR ALL
  USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    OR load_id IN (SELECT id FROM loads WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    OR load_id IN (SELECT id FROM loads WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );

-- ─── 4.8 RLS: REVIEWS ───────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_admin_all ON reviews;
CREATE POLICY reviews_admin_all ON reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS reviews_gestor_all ON reviews;
CREATE POLICY reviews_gestor_all ON reviews
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS reviews_self ON reviews;
CREATE POLICY reviews_self ON reviews
  FOR ALL
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ─── 4.9 RLS: MESSAGES ──────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_admin_all ON messages;
CREATE POLICY messages_admin_all ON messages
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS messages_gestor_all ON messages;
CREATE POLICY messages_gestor_all ON messages
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS messages_involved ON messages;
CREATE POLICY messages_involved ON messages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = messages.match_id
      AND (m.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
           OR m.load_id IN (SELECT id FROM loads WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())))
  ))
  WITH CHECK (sender_id = auth.uid());

-- ─── 4.10 RLS: NOTIFICATIONS ────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_admin_all ON notifications;
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS notifications_self ON notifications;
CREATE POLICY notifications_self ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── 4.11 RLS: DOCUMENTS ────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_admin_all ON documents;
CREATE POLICY documents_admin_all ON documents
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS documents_gestor_all ON documents;
CREATE POLICY documents_gestor_all ON documents
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

DROP POLICY IF EXISTS documents_self ON documents;
CREATE POLICY documents_self ON documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 5. TRIGGER: Sincronizar auth.users → public.users
-- ═══════════════════════════════════════════════════════════
-- Quando um usuário é criado via Supabase Auth, este trigger
-- cria automaticamente o registro correspondente em public.users
-- com o role definido em raw_user_meta_data['role']

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, password, role, phone, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.encrypted_password, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'motorista'),
    NEW.raw_user_meta_data ->> 'phone',
    1
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- 6. TRIGGER: Deletar public.users quando usuário for removido
-- ═══════════════════════════════════════════════════════════
-- Quando um usuário é excluído no Supabase Auth (dashboard ou API),
-- este trigger remove o registro correspondente em public.users.
-- As FKs com ON DELETE CASCADE cuidam do resto (companies, drivers, etc.)

CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_user();

-- ═══════════════════════════════════════════════════════════
-- 7. SINCRONIZAR ADMIN EXISTENTE
-- ═══════════════════════════════════════════════════════════
--
-- ⚠️  Crie o usuário no Supabase Auth primeiro:
--   Authentication > Users > Add User
--   Email: daniel.kokynhw@gmail.com
--   Password: Dcm02061994@
--   User Metadata: {"name": "Daniel Kokynhw", "role": "administrador"}
--
--   O trigger on_auth_user_created vai criar o registro
--   automaticamente em public.users com o UID correto.

DO $$
DECLARE
  _auth_uid UUID := '47eabb86-e5d4-47fd-a9e1-ff7085fb0815';
  _user_email TEXT := 'daniel.kokynhw@gmail.com';
  _user_name TEXT := 'Daniel Kokynhw';
  _old_id UUID;
BEGIN
  SELECT id INTO _old_id FROM public.users WHERE email = _user_email;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = _auth_uid) THEN
    UPDATE public.users
    SET role = 'administrador', name = _user_name, updated_at = NOW()
    WHERE id = _auth_uid;
    RAISE NOTICE '✅ UID % já existia — role/name atualizados', _auth_uid;

  ELSIF _old_id IS NOT NULL AND _old_id != _auth_uid THEN
    -- Migra FKs do ID antigo para o auth UID
    UPDATE companies SET user_id = _auth_uid WHERE user_id = _old_id;
    UPDATE drivers   SET user_id = _auth_uid WHERE user_id = _old_id;
    UPDATE reviews   SET reviewer_id = _auth_uid WHERE reviewer_id = _old_id;
    UPDATE reviews   SET reviewee_id = _auth_uid WHERE reviewee_id = _old_id;
    UPDATE messages  SET sender_id = _auth_uid WHERE sender_id = _old_id;
    UPDATE notifications SET user_id = _auth_uid WHERE user_id = _old_id;
    UPDATE documents SET user_id = _auth_uid WHERE user_id = _old_id;

    -- Remove o registro antigo e insere com o novo ID
    DELETE FROM public.users WHERE id = _old_id;

    INSERT INTO public.users (id, name, email, password, role, phone, active)
    VALUES (_auth_uid, _user_name, _user_email, '', 'administrador', '11999999999', 1);

    RAISE NOTICE '✅ Usuário % migrado de % para %', _user_email, _old_id, _auth_uid;

  ELSE
    INSERT INTO public.users (id, name, email, password, role, phone, active)
    VALUES (_auth_uid, _user_name, _user_email, '', 'administrador', '11999999999', 1);
    RAISE NOTICE '✅ Usuário % criado como administrador (UID: %)', _user_email, _auth_uid;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 7. VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════
-- Execute para confirmar:
--   SELECT id, name, email, role FROM public.users;
--   SELECT tablename, policyname FROM pg_policies ORDER BY tablename;
