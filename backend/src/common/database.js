import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

const dbPath = config.DATABASE_URL.replace("file:", "");

// Cria o diretório do banco automaticamente se não existir
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Abre conexão com SQLite usando o módulo nativo do Node.js
const db = new DatabaseSync(dbPath);

// Habilita WAL mode e foreign keys
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// ── Helper: preparar e executar uma query ──────────────
export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

// ── Helper: executar uma query e retornar a primeira linha ──
export function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0];
}

// ── Helper: executar INSERT/UPDATE/DELETE ──────────────
export function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return result;
}

// ── Inicialização das tabelas ──────────────────────────
export function initDatabase() {
  db.exec(`
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
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled')),
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

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_loads_origin_dest ON loads(origin_city, destination_city);
    CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
    CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_city, destination_city);
    CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);
}

// ── Gerador de UUIDs simples ──────────────────────────
export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export { db };
export default db;
