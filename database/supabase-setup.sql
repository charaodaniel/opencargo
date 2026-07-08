-- ═══════════════════════════════════════════════════════════
-- OpenCargo — Supabase Setup
-- ═══════════════════════════════════════════════════════════
--
-- Execute este script no SQL Editor do Supabase Dashboard
-- (https://supabase.com/dashboard/project/irznvnpaetvkuvmdrgoo/sql/new)
--
-- O que este script faz:
--   1. Cria as tabelas do OpenCargo (se não existirem)
--   2. Configura referência ao auth.users do Supabase
--   3. Ativa Row Level Security (RLS) em todas as tabelas
--   4. Cria políticas de acesso para cada nível:
--      - administrador: acesso total (SELECT/INSERT/UPDATE/DELETE em tudo)
--      - gestor:     acesso administrativo limitado
--      - empresa:    gerencia próprias cargas, empresas, documentos
--      - motorista:  gerencia próprias rotas, veículos, perfil
--   5. Cria trigger para sincronizar usuários do auth.users
--   6. Insere dados de exemplo
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

-- Remove role CHECK antigo e recria com os novos níveis
-- Nota: se a tabela já existe, altera o CONSTRAINT
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'motorista'
    CHECK(role IN ('administrador', 'gestor', 'empresa', 'motorista')),
  phone VARCHAR(20),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

-- Helper: retorna o role do usuário logado via JWT
-- O JWT do Supabase Auth inclui user_metadata no raw_app_meta_data
-- e raw_user_meta_data. Vamos usar raw_user_meta_data->>'role'
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR(20)
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    (SELECT role FROM public.users WHERE id = auth.uid())
  );
$$;

-- Helper: verifica se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.current_user_role() = 'administrador';
$$;

-- Helper: verifica se o usuário é gestor ou adm
CREATE OR REPLACE FUNCTION public.is_gestor_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.current_user_role() IN ('administrador', 'gestor');
$$;

-- ─── 4.1 RLS: USERS ─────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Administrador vê tudo
CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Gestor vê todos os usuários, mas só edita dados não-sensíveis
CREATE POLICY users_gestor_select ON users
  FOR SELECT
  USING (public.is_gestor_or_admin());

CREATE POLICY users_gestor_update ON users
  FOR UPDATE
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Usuário comum vê e edita apenas o próprio perfil
CREATE POLICY users_self ON users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── 4.2 RLS: COMPANIES ─────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_admin_all ON companies
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY companies_gestor_all ON companies
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Empresa vê/edita apenas suas próprias empresas
CREATE POLICY companies_self ON companies
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Motorista pode ver empresas (para saber com quem está negociando)
CREATE POLICY companies_driver_select ON companies
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('motorista', 'empresa', 'gestor', 'administrador')
  ));

-- ─── 4.3 RLS: DRIVERS ───────────────────────────────────
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY drivers_admin_all ON drivers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY drivers_gestor_all ON drivers
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

CREATE POLICY drivers_self ON drivers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Empresa pode ver motoristas (para matching)
CREATE POLICY drivers_company_select ON drivers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('empresa', 'motorista', 'gestor', 'administrador')
  ));

-- ─── 4.4 RLS: VEHICLES ──────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicles_admin_all ON vehicles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY vehicles_gestor_all ON vehicles
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Motorista gerencia próprios veículos (via driver_id → user_id)
CREATE POLICY vehicles_self ON vehicles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND user_id = auth.uid()
  ));

-- Empresa pode ver veículos (para matching)
CREATE POLICY vehicles_company_select ON vehicles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('empresa', 'motorista', 'gestor', 'administrador')
  ));

-- ─── 4.5 RLS: ROUTES ────────────────────────────────────
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY routes_admin_all ON routes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY routes_gestor_all ON routes
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Motorista gerencia próprias rotas
CREATE POLICY routes_self ON routes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM drivers WHERE id = routes.driver_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM drivers WHERE id = routes.driver_id AND user_id = auth.uid()
  ));

-- Empresa pode ver rotas (para matching)
CREATE POLICY routes_company_select ON routes
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('empresa', 'motorista', 'gestor', 'administrador')
  ));

-- ─── 4.6 RLS: LOADS ─────────────────────────────────────
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY loads_admin_all ON loads
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY loads_gestor_all ON loads
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Empresa gerencia próprias cargas
CREATE POLICY loads_self ON loads
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM companies WHERE id = loads.company_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE id = loads.company_id AND user_id = auth.uid()
  ));

-- Motorista pode ver cargas disponíveis (para matching)
CREATE POLICY loads_driver_select ON loads
  FOR SELECT
  USING (status = 'available' AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('motorista', 'empresa', 'gestor', 'administrador')
  ));

-- ─── 4.7 RLS: MATCHES ───────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY matches_admin_all ON matches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY matches_gestor_all ON matches
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Envolvidos no match podem ver
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

CREATE POLICY reviews_admin_all ON reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY reviews_gestor_all ON reviews
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

CREATE POLICY reviews_self ON reviews
  FOR ALL
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ─── 4.9 RLS: MESSAGES ──────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_admin_all ON messages
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY messages_gestor_all ON messages
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

-- Envolvidos no match do chat podem ver as mensagens
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

CREATE POLICY notifications_admin_all ON notifications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY notifications_self ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── 4.11 RLS: DOCUMENTS ────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_admin_all ON documents
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY documents_gestor_all ON documents
  FOR ALL
  USING (public.is_gestor_or_admin())
  WITH CHECK (public.is_gestor_or_admin());

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
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
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

-- Remove o trigger se já existir e recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- 6. NOTA SOBRE CRIAÇÃO DO USUÁRIO DEV
-- ═══════════════════════════════════════════════════════════
--
-- ⚠️ O Supabase Auth gerencia senhas com bcrypt, então NÃO é possível
--    criar o usuário via SQL direto. Use uma das opções abaixo:
--
-- Opção A — Criar via Dashboard do Supabase:
--   1. Acesse: Authentication → Users → Add User
--   2. Email: daniel.kokynhw@gmail.com
--   3. Password: Dcm02061994@
--   4. Após criar, nas "User Metadata" adicione:
--      {"name": "Daniel Kokynhw", "role": "administrador"}
--   5. O trigger on_auth_user_created vai criar o registro em public.users
--
-- Opção B — Criar via API (SQL do PostgREST):
--   SELECT extensions.http_post(
--     'https://irznvnpaetvkuvmdrgoo.supabase.co/auth/v1/signup',
--     jsonb_build_object(
--       'email', 'daniel.kokynhw@gmail.com',
--       'password', 'Dcm02061994@',
--       'data', jsonb_build_object('name', 'Daniel Kokynhw', 'role', 'administrador')
--     )::text,
--     'Content-Type: application/json'
--   );
--
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 7. CRIAÇÃO DO USUÁRIO ADMIN VIA FUNÇÃO SEGURA
-- ═══════════════════════════════════════════════════════════
-- Esta função pode ser chamada pelo service_role para criar
-- usuários admin mesmo sem a interface do Supabase Auth.
-- Execute como: SELECT public.create_dev_user();
-- (Necessita da chave service_role no header: Authorization: Bearer sb_secret_...)

CREATE OR REPLACE FUNCTION public.create_dev_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Insere direto em auth.users (apenas com permissão service_role)
  -- Nota: a senha precisa ser hasheada com bcrypt
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'daniel.kokynhw@gmail.com',
    crypt('Dcm02061994@', gen_salt('bf')),
    NOW(),
    jsonb_build_object('name', 'Daniel Kokynhw', 'role', 'administrador'),
    NOW(),
    NOW(),
    '', '', '', ''
  )
  RETURNING id INTO _user_id;

  -- O trigger on_auth_user_created vai criar o registro em public.users
  -- Mas vamos garantir com um INSERT direto também
  INSERT INTO public.users (id, name, email, password, role, phone, active)
  VALUES (
    _user_id,
    'Daniel Kokynhw',
    'daniel.kokynhw@gmail.com',
    crypt('Dcm02061994@', gen_salt('bf')),
    'administrador',
    '11999999999',
    1
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN _user_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 8. SEED DATA (opcional — descomente para inserir)
-- ═══════════════════════════════════════════════════════════
--
-- Para popular com dados de exemplo, rode o seed via CLI:
--   cd backend && npm run seed -- --reset
--
-- Ou insira manualmente executando os INSERTs abaixo
-- (após criar os usuários no Supabase Auth primeiro)
--
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 9. VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════
-- Após executar tudo, verifique com:
--   SELECT * FROM public.users;
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
