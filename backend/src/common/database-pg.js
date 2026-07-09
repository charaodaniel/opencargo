// ── OpenCargo — PostgreSQL Database Adapter ─────────────────
// Fornece a mesma API que database.js (query, queryOne, execute, uuid, initDatabase)
// mas utilizando PostgreSQL em vez de SQLite.
//
// Uso automático: database.js detecta DATABASE_URL começando com "postgres"
// e importa este adaptador.

import pg from "pg";

const { Pool } = pg;

let pool = null;

/**
 * Conecta ao PostgreSQL e retorna o pool
 */
function getPool() {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;

  pool = new Pool({
    connectionString: url,
    ssl:
      process.env.NODE_ENV === "production" ||
      url.includes("aivencloud") ||
      url.includes("supabase")
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return pool;
}

/**
 * Normaliza placeholders de ? para $1, $2, $3...
 * Isso permite que o seed use ? (compatível com SQLite) e funcione nos dois bancos.
 */
function normalizeParams(sql, params) {
  if (!params || params.length === 0) return { sql, params };
  // Só converte se a query usar ? (não $N)
  if (!sql.includes("?")) return { sql, params };

  let idx = 0;
  const normalizedSql = sql.replace(/\?/g, () => `$${++idx}`);
  return { sql: normalizedSql, params };
}

/**
 * Executa uma query SQL com parâmetros
 * @param {string} sql
 * @param {Array} params
 * @returns {Array} Linhas retornadas
 */
export async function query(sql, params = []) {
  const { sql: finalSql, params: finalParams } = normalizeParams(sql, params);
  const client = await getPool().connect();
  try {
    const result = await client.query(finalSql, finalParams);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Executa query e retorna primeira linha
 * @param {string} sql
 * @param {Array} params
 * @returns {Object|null}
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Executa INSERT/UPDATE/DELETE
 * @param {string} sql
 * @param {Array} params
 * @returns {Object} Resultado com rowCount
 */
export async function execute(sql, params = []) {
  const { sql: finalSql, params: finalParams } = normalizeParams(sql, params);
  const client = await getPool().connect();
  try {
    const result = await client.query(finalSql, finalParams);
    return { rowCount: result.rowCount, rows: result.rows };
  } finally {
    client.release();
  }
}

/**
 * Gera UUID v4
 * @returns {string}
 */
export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Inicializa as tabelas (se não existirem)
 */
export async function initDatabase() {
  const client = await getPool().connect();
  try {
    // Habilita extensão UUID
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'motorista' CHECK(role IN ('administrador', 'gestor', 'empresa', 'motorista')),
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
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
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
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'available', 'matched', 'in_transit', 'delivered', 'cancelled')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
        route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        score REAL NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
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
        entity_type VARCHAR(20) NOT NULL CHECK(entity_type IN ('company', 'driver', 'vehicle', 'load', 'general')),
        entity_id UUID,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Índices
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
      "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
      "CREATE INDEX IF NOT EXISTS idx_loads_origin_dest ON loads(origin_city, destination_city);",
      "CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);",
      "CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_city, destination_city);",
      "CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);",
      "CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);",
      "CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);",
      "CREATE INDEX IF NOT EXISTS idx_reviews_match ON reviews(match_id);",
      "CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);",
      "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);",
      "CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);",
      "CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);",
    ];

    for (const idx of indexes) {
      await client.query(idx);
    }
  } finally {
    client.release();
  }
}

/**
 * Fecha o pool de conexões
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export { getPool };
export default { query, queryOne, execute, uuid, initDatabase, closePool };
