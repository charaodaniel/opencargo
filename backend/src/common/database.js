// ── OpenCargo — Database Adapter ───────────────────────────
// Detecta automaticamente o banco de dados baseado na DATABASE_URL:
//   - "file:./data/opencargo.db" → SQLite
//   - "postgres://..." → PostgreSQL
//
// ⚠️ A detecção é feita sob demanda (lazy), não no top-level do módulo.
// Isso permite que test/setup.js sobrescreva DATABASE_URL antes da
// primeira query, já que ES modules têm hoisting de imports.
//
// Exporta: query, queryOne, execute, uuid, initDatabase, getPool, closePool

import { config } from "./config.js";

let _adapter = null;
let _db = null;

/**
 * Retorna true se DATABASE_URL aponta para PostgreSQL
 * Lê direto de process.env (não de config) para que test/setup.js
 * possa sobrescrever a env var ANTES da primeira query, mesmo com
 * o hoisting de imports do ES module.
 */
function isPostgres() {
  const url = process.env.DATABASE_URL || config.DATABASE_URL;
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

/**
 * Inicializa e retorna o adaptador do banco (lazy)
 */
async function getAdapter() {
  if (_adapter) return _adapter;

  if (isPostgres()) {
    // ── PostgreSQL ─────────────────────────────────────────────
    const pgModule = await import("./database-pg.js");
    _adapter = pgModule;
  } else {
    // ── SQLite ────────────────────────────────────────────────
    const { existsSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");
    const { DatabaseSync } = await import("node:sqlite");

    // Lê DATABASE_URL direto do process.env para respeitar override
    // do test/setup.js (que ocorre após o hoisting dos imports)
    const dbUrl = process.env.DATABASE_URL || config.DATABASE_URL;
    const dbPath = dbUrl.replace("file:", "");

    // Cria o diretório do banco automaticamente se não existir
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    _db = new DatabaseSync(dbPath);
    _db.exec("PRAGMA journal_mode = WAL;");
    _db.exec("PRAGMA foreign_keys = ON;");

    // ── Helpers SQLite (síncronos) ────────────────────────────
    function _query(sql, params = []) {
      const stmt = _db.prepare(sql);
      return stmt.all(...params);
    }

    function _execute(sql, params = []) {
      const stmt = _db.prepare(sql);
      return stmt.run(...params);
    }

    function _uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    }

    _adapter = {
      _db,
      query: _query,
      queryOne(sql, params = []) {
        const rows = _query(sql, params);
        return rows[0];
      },
      execute: _execute,
      uuid: _uuid,
      initDatabase() {
        _db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'motorista' CHECK(role IN ('administrador', 'gestor', 'empresa', 'motorista')),
            phone TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

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

          CREATE TABLE IF NOT EXISTS matches (
            id TEXT PRIMARY KEY,
            load_id TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
            driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
            route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
            score REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
            reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
            comment TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
            sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

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
          _db.exec(idx);
        }
      },
      closePool() {
        // SQLite connection is closed when process exits
      },
    };
  }

  return _adapter;
}

// ── Exporta a interface unificada (lazy) ──────────────────

export async function query(sql, params = []) {
  const a = await getAdapter();
  return a.query(sql, params);
}

export async function queryOne(sql, params = []) {
  const a = await getAdapter();
  return a.queryOne(sql, params);
}

export async function execute(sql, params = []) {
  const a = await getAdapter();
  return a.execute(sql, params);
}

export function uuid() {
  // uuid é síncrono nos dois adaptadores
  if (_adapter) return _adapter.uuid();
  // Fallback inline
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function initDatabase() {
  const a = await getAdapter();
  return a.initDatabase();
}

export async function closePool() {
  if (_adapter && _adapter.closePool) {
    await _adapter.closePool();
  }
}

export async function getPool() {
  const a = await getAdapter();
  return a.getPool ? a.getPool() : null;
}

export { getAdapter };
export default { query, queryOne, execute, uuid, initDatabase, closePool, getPool };
