-- ── OpenCargo — Database Initialization ──────────────
-- SQL para inicializar o banco de dados
-- Compatível com SQLite (desenvolvimento)

-- Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'driver' CHECK(role IN ('admin', 'company', 'driver')),
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Empresas
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT NOT NULL UNIQUE,
    address TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Motoristas
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT NOT NULL UNIQUE,
    cnh TEXT,
    phone TEXT,
    city TEXT,
    state TEXT,
    available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    plate TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    year INTEGER,
    capacity_kg REAL NOT NULL,
    capacity_m3 REAL NOT NULL,
    type TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rotas
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    origin_city TEXT NOT NULL,
    origin_state TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    arrival_date TEXT NOT NULL,
    available_weight REAL,
    available_volume REAL,
    is_return INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cargas
CREATE TABLE IF NOT EXISTS loads (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    origin_city TEXT NOT NULL,
    origin_state TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    volume_m3 REAL,
    type TEXT,
    pickup_date TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'available', 'matched', 'in_transit', 'delivered', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    load_id TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    score REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Avaliações
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Histórico de Atividades
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Documentos
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('company', 'driver', 'vehicle', 'load', 'general')),
    entity_id TEXT,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_loads_origin_dest ON loads(origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_reviews_match ON reviews(match_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
