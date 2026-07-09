-- ═══════════════════════════════════════════════════════════
-- OpenCargo — RLS + Trigger + Admin UID Sync (Supabase)
-- ═══════════════════════════════════════════════════════════
--
-- ⚠️  As tabelas já existem (criadas pelo seed ou pelo setup).
-- Este script APENAS adiciona:
--   1. Row Level Security (RLS) + políticas por role
--   2. Trigger handle_new_user() para sync auth.users → public.users
--   3. Sincroniza seu UID do auth.users como administrador
--
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. HELPER FUNCTIONS + RLS
-- ═══════════════════════════════════════════════════════════

-- Helper: retorna o role do usuário logado via JWT
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

-- ─── RLS: USERS ─────────────────────────────────────────
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

-- ─── RLS: COMPANIES ─────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_admin_all ON companies;
CREATE POLICY companies_admin_all ON companies
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ─── RLS: DRIVERS ───────────────────────────────────────
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drivers_admin_all ON drivers;
CREATE POLICY drivers_admin_all ON drivers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ─── RLS: VEHICLES ──────────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicles_admin_all ON vehicles;
CREATE POLICY vehicles_admin_all ON vehicles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS vehicles_self ON vehicles;
CREATE POLICY vehicles_self ON vehicles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND user_id = auth.uid()
  ));

-- ─── RLS: ROUTES ────────────────────────────────────────
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routes_admin_all ON routes;
CREATE POLICY routes_admin_all ON routes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS routes_self ON routes;
CREATE POLICY routes_self ON routes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM drivers WHERE id = routes.driver_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM drivers WHERE id = routes.driver_id AND user_id = auth.uid()
  ));

-- ─── RLS: LOADS ─────────────────────────────────────────
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loads_admin_all ON loads;
CREATE POLICY loads_admin_all ON loads
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ─── RLS: MATCHES ───────────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS matches_admin_all ON matches;
CREATE POLICY matches_admin_all ON matches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ─── RLS: REVIEWS ───────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_admin_all ON reviews;
CREATE POLICY reviews_admin_all ON reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS reviews_self ON reviews;
CREATE POLICY reviews_self ON reviews
  FOR ALL
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ─── RLS: MESSAGES ──────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_admin_all ON messages;
CREATE POLICY messages_admin_all ON messages
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ─── RLS: NOTIFICATIONS ─────────────────────────────────
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

-- ─── RLS: DOCUMENTS ─────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_admin_all ON documents;
CREATE POLICY documents_admin_all ON documents
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS documents_self ON documents;
CREATE POLICY documents_self ON documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 2. TRIGGER: Sincronizar auth.users → public.users
-- ═══════════════════════════════════════════════════════════

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
-- 3. TRIGGER: Deletar public.users quando usuário for removido
-- ═══════════════════════════════════════════════════════════

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
-- 4. SINCRONIZAR SEU UID COMO ADMIN
-- ═══════════════════════════════════════════════════════════
-- Crie o usuário no Supabase Auth primeiro:
--   Authentication > Add User
--   Email: daniel.kokynhw@gmail.com
--   Password: Dcm02061994@
--   User Metadata: {"name": "Daniel Kokynhw", "role": "administrador"}

DO $$
DECLARE
  _auth_uid UUID := '47eabb86-e5d4-47fd-a9e1-ff7085fb0815';
  _user_email TEXT := 'daniel.kokynhw@gmail.com';
  _user_name TEXT := 'Daniel Kokynhw';
  _old_id UUID;
BEGIN
  SELECT id INTO _old_id FROM public.users WHERE email = _user_email;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = _auth_uid) THEN
    UPDATE public.users SET role = 'administrador', name = _user_name, updated_at = NOW()
    WHERE id = _auth_uid;
    RAISE NOTICE '✅ UID % — role/name atualizados', _auth_uid;

  ELSIF _old_id IS NOT NULL AND _old_id != _auth_uid THEN
    UPDATE companies SET user_id = _auth_uid WHERE user_id = _old_id;
    UPDATE drivers   SET user_id = _auth_uid WHERE user_id = _old_id;
    UPDATE reviews   SET reviewer_id = _auth_uid WHERE reviewer_id = _old_id;
    UPDATE reviews   SET reviewee_id = _auth_uid WHERE reviewee_id = _old_id;
    UPDATE messages  SET sender_id = _auth_uid WHERE sender_id = _old_id;
    UPDATE notifications SET user_id = _auth_uid WHERE user_id = _old_id;
    UPDATE documents SET user_id = _auth_uid WHERE user_id = _old_id;

    DELETE FROM public.users WHERE id = _old_id;
    INSERT INTO public.users (id, name, email, password, role, phone, active)
    VALUES (_auth_uid, _user_name, _user_email, '', 'administrador', '11999999999', 1);
    RAISE NOTICE '✅ Usuário % migrado para UID %', _user_email, _auth_uid;

  ELSE
    INSERT INTO public.users (id, name, email, password, role, phone, active)
    VALUES (_auth_uid, _user_name, _user_email, '', 'administrador', '11999999999', 1);
    RAISE NOTICE '✅ Usuário % criado como administrador', _user_email;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 4. VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════
--   SELECT id, name, email, role FROM public.users;
--   SELECT tablename, policyname FROM pg_policies ORDER BY tablename;
