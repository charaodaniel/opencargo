// ── OpenCargo — Test Setup ────────────────────────────
// Helpers compartilhados para os testes de API

import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_DIR = join(__dirname, "..", "data");
const TEST_DB_PATH = join(TEST_DB_DIR, "test.db");

// Configura ambiente de teste antes de qualquer import
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
process.env.JWT_SECRET = "test-secret-opencargo";
process.env.RATE_LIMIT_MAX = "1000";
process.env.SUPABASE_URL = "";

import { buildApp } from "../src/app.js";
import { initDatabase, execute } from "../src/common/database.js";

// Lista de tabelas na ordem correta (filhas primeiro para FK)
const TABLES = [
  "notifications", "messages", "matches",
  "loads", "routes", "vehicles",
  "drivers", "companies", "users",
];

/**
 * Limpa todas as tabelas do banco de dados
 */
export async function cleanDatabase() {
  for (const table of TABLES) {
    await execute(`DELETE FROM ${table}`);
  }
}

/**
 * Cria uma instância do app para testes
 */
export async function createTestApp() {
  // Garante que o diretório existe
  if (!existsSync(TEST_DB_DIR)) {
    mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  await initDatabase();

  const app = await buildApp();
  await app.ready();

  return app;
}

/**
 * Helper para fazer requisições injetadas no Fastify
 */
export async function request(app, options) {
  const response = await app.inject(options);
  return {
    status: response.statusCode,
    headers: response.headers,
    body: response.body ? JSON.parse(response.body) : null,
    rawBody: response.body,
  };
}

/**
 * Helper para registrar usuário e retornar token
 */
export async function registerUser(app, userData) {
  const res = await request(app, {
    method: "POST",
    url: "/api/auth/register",
    payload: userData,
  });

  if (res.status !== 201) {
    throw new Error(`Falha ao registrar: ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.token,
    user: res.body.user,
  };
}

/**
 * Helper para autenticar e fazer request autenticado
 */
export async function authRequest(app, token, options) {
  return request(app, {
    ...options,
    headers: {
      ...options.headers,
      authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Cria dados de teste completos: empresa + motorista + carga + rota
 */
export async function createTestData(app) {
  // 1. Registrar empresa
  const company = await registerUser(app, {
    name: "Empresa Teste Ltda",
    email: "empresa@teste.com",
    password: "123456",
    role: "empresa",
  });

  // 2. Criar perfil empresa
  await authRequest(app, company.token, {
    method: "POST",
    url: "/api/companies",
    payload: {
      name: "Empresa Teste Ltda",
      document: "11222333000181",
      address: "Rua A, 100",
      city: "São Paulo",
      state: "SP",
      phone: "11999999999",
    },
  });

  // 3. Registrar motorista
  const driver = await registerUser(app, {
    name: "Motorista Teste",
    email: "motorista@teste.com",
    password: "123456",
    role: "motorista",
  });

  // 4. Criar perfil motorista
  const driverRes = await authRequest(app, driver.token, {
    method: "POST",
    url: "/api/drivers",
    payload: {
      name: "Motorista Teste",
      document: "12345678909",
      cnh: "1234567890",
      phone: "11988888888",
      city: "São Paulo",
      state: "SP",
    },
  });

  // 5. Criar veículo
  await authRequest(app, driver.token, {
    method: "POST",
    url: "/api/vehicles",
    payload: {
      plate: "ABC1234",
      model: "Caminhão Teste",
      year: 2023,
      capacityKg: 15000,
      capacityM3: 60,
      type: "truck",
    },
  });

  const driverId = driverRes.body.id;

  return { company, driver, driverId };
}
