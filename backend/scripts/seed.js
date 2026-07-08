#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════
// OpenCargo — Seed Script
// ═══════════════════════════════════════════════════════════
//
// Popula o banco de dados com dados de exemplo realistas.
// Funciona com SQLite e PostgreSQL automaticamente.
//
// Uso:
//   node scripts/seed.js            # Insere dados
//   node scripts/seed.js --reset    # Remove dados existentes antes
//   node scripts/seed.js --help     # Ajuda
//
// ═══════════════════════════════════════════════════════════

import "dotenv/config";
import bcrypt from "bcryptjs";

// Importa os helpers do banco (detecta SQLite vs PostgreSQL automaticamente)
import { query, queryOne, execute, uuid, initDatabase, db, closePool } from "../src/common/database.js";

// Detecta se está usando PostgreSQL
const IS_PG =
  (process.env.DATABASE_URL || "").startsWith("postgres://") ||
  (process.env.DATABASE_URL || "").startsWith("postgresql://");

// ── Tabelas na ordem para reset (filhas primeiro por FK) ─
const TABLES = [
  "notifications", "messages", "matches",
  "loads", "routes", "vehicles",
  "drivers", "companies", "users",
];

// ── Reset ──────────────────────────────────────────────────
async function resetDatabase() {
  console.log("🧹 Removendo dados existentes...");

  // Deleta na ordem correta (filhas primeiro) para respeitar FKs
  // PostgreSQL: UUIDs não têm sequences, então apenas DELETE
  for (const table of TABLES) {
    await execute(`DELETE FROM ${table}`);
  }

  console.log("✅ Banco limpo!\n");
}

// ── Seed Data ──────────────────────────────────────────────

async function seed() {
  console.log("🌱 OpenCargo — Inserindo dados de exemplo...\n");

  const passwordHash = await bcrypt.hash("123456", 10);

  // ── 1. USUÁRIOS ──────────────────────────────────────────
  console.log("👤 Usuários...");

  const users = [
    { id: uuid(), name: "Admin OpenCargo", email: "admin@opencargo.com", role: "admin", phone: "11911111111" },
    { id: uuid(), name: "Transportadora ABC", email: "abc@transportadora.com", role: "company", phone: "11922222222" },
    { id: uuid(), name: "Logística Brasil Ltda", email: "contato@logisticabrasil.com", role: "company", phone: "11933333333" },
    { id: uuid(), name: "João Silva", email: "joao@motorista.com", role: "driver", phone: "11944444444" },
    { id: uuid(), name: "Maria Souza", email: "maria@motorista.com", role: "driver", phone: "11955555555" },
  ];

  for (const u of users) {
    await execute(
      `INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, passwordHash, u.role, u.phone]
    );
  }
  console.log(`  → ${users.length} usuários criados`);

  // ── 2. EMPRESAS ──────────────────────────────────────────
  console.log("🏢 Empresas...");

  const companies = [
    {
      id: uuid(), userId: users[1].id,
      name: "Transportadora ABC Ltda", document: "11222333000181",
      address: "Av. Paulista, 1000", city: "São Paulo", state: "SP", phone: "11922222222",
    },
    {
      id: uuid(), userId: users[2].id,
      name: "Logística Brasil S.A.", document: "99888777000155",
      address: "Rua da Alfândega, 50", city: "Rio de Janeiro", state: "RJ", phone: "21933333333",
    },
  ];

  for (const c of companies) {
    await execute(
      `INSERT INTO companies (id, user_id, name, document, address, city, state, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.userId, c.name, c.document, c.address, c.city, c.state, c.phone]
    );
  }
  console.log(`  → ${companies.length} empresas criadas`);

  // ── 3. MOTORISTAS ────────────────────────────────────────
  console.log("👨‍✈️ Motoristas...");

  const drivers = [
    {
      id: uuid(), userId: users[3].id,
      name: "João Silva", document: "12345678901", cnh: "12345678901",
      phone: "11944444444", city: "São Paulo", state: "SP", available: 1,
    },
    {
      id: uuid(), userId: users[4].id,
      name: "Maria Souza", document: "98765432100", cnh: "98765432100",
      phone: "11955555555", city: "Curitiba", state: "PR", available: 1,
    },
  ];

  for (const d of drivers) {
    await execute(
      `INSERT INTO drivers (id, user_id, name, document, cnh, phone, city, state, available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.userId, d.name, d.document, d.cnh, d.phone, d.city, d.state, d.available]
    );
  }
  console.log(`  → ${drivers.length} motoristas criados`);

  // ── 4. VEÍCULOS ──────────────────────────────────────────
  console.log("🚛 Veículos...");

  const vehicles = [
    {
      id: uuid(), driverId: drivers[0].id,
      plate: "ABC1D23", model: "Volvo FH 460", year: 2023,
      capacityKg: 18000, capacityM3: 80, type: "carreta",
    },
    {
      id: uuid(), driverId: drivers[0].id,
      plate: "XYZ4E56", model: "Mercedes-Benz Actros 2651", year: 2024,
      capacityKg: 15000, capacityM3: 60, type: "truck",
    },
    {
      id: uuid(), driverId: drivers[1].id,
      plate: "DEF7G89", model: "Scania R 450", year: 2022,
      capacityKg: 20000, capacityM3: 90, type: "carreta",
    },
  ];

  for (const v of vehicles) {
    await execute(
      `INSERT INTO vehicles (id, driver_id, plate, model, year, capacity_kg, capacity_m3, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.id, v.driverId, v.plate, v.model, v.year, v.capacityKg, v.capacityM3, v.type]
    );
  }
  console.log(`  → ${vehicles.length} veículos criados`);

  // ── 5. ROTAS ─────────────────────────────────────────────
  console.log("🛣️  Rotas...");

  const routes = [
    {
      id: uuid(), driverId: drivers[0].id,
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Porto Alegre", destinationState: "RS",
      departureDate: "2026-07-10", arrivalDate: "2026-07-12",
      availableWeight: 5000, availableVolume: 30, isReturn: 0, status: "active",
    },
    {
      id: uuid(), driverId: drivers[0].id,
      originCity: "Porto Alegre", originState: "RS",
      destinationCity: "São Paulo", destinationState: "SP",
      departureDate: "2026-07-14", arrivalDate: "2026-07-15",
      availableWeight: 8000, availableVolume: 40, isReturn: 1, status: "active",
    },
    {
      id: uuid(), driverId: drivers[1].id,
      originCity: "Curitiba", originState: "PR",
      destinationCity: "Belo Horizonte", destinationState: "MG",
      departureDate: "2026-07-11", arrivalDate: "2026-07-13",
      availableWeight: 7000, availableVolume: 35, isReturn: 0, status: "active",
    },
    {
      id: uuid(), driverId: drivers[1].id,
      originCity: "Belo Horizonte", originState: "MG",
      destinationCity: "Curitiba", destinationState: "PR",
      departureDate: "2026-07-15", arrivalDate: "2026-07-16",
      availableWeight: 12000, availableVolume: 50, isReturn: 1, status: "active",
    },
    {
      id: uuid(), driverId: drivers[0].id,
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Rio de Janeiro", destinationState: "RJ",
      departureDate: "2026-06-28", arrivalDate: "2026-06-28",
      availableWeight: 0, availableVolume: 0, isReturn: 0, status: "completed",
    },
  ];

  for (const r of routes) {
    await execute(
      `INSERT INTO routes (id, driver_id, origin_city, origin_state, destination_city, destination_state, departure_date, arrival_date, available_weight, available_volume, is_return, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.driverId, r.originCity, r.originState, r.destinationCity, r.destinationState, r.departureDate, r.arrivalDate, r.availableWeight, r.availableVolume, r.isReturn, r.status]
    );
  }
  console.log(`  → ${routes.length} rotas criadas`);

  // ── 6. CARGAS ────────────────────────────────────────────
  console.log("📦 Cargas...");

  const loads = [
    {
      id: uuid(), companyId: companies[0].id,
      title: "Eletrônicos — SP para POA",
      description: "Lote de computadores e periféricos. Necessário baú seco.",
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Porto Alegre", destinationState: "RS",
      weightKg: 3000, volumeM3: 20, type: "eletrônicos",
      pickupDate: "2026-07-11", deliveryDate: "2026-07-12", status: "available",
    },
    {
      id: uuid(), companyId: companies[0].id,
      title: "Móveis — SP para POA",
      description: "Móveis planejados para loja em Porto Alegre. Carga delicada.",
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Porto Alegre", destinationState: "RS",
      weightKg: 4000, volumeM3: 25, type: "móveis",
      pickupDate: "2026-07-12", deliveryDate: "2026-07-13", status: "pending",
    },
    {
      id: uuid(), companyId: companies[1].id,
      title: "Alimentos — RJ para BH",
      description: "Alimentos não perecíveis para distribuição em BH.",
      originCity: "Rio de Janeiro", originState: "RJ",
      destinationCity: "Belo Horizonte", destinationState: "MG",
      weightKg: 5000, volumeM3: 30, type: "alimentos",
      pickupDate: "2026-07-12", deliveryDate: "2026-07-13", status: "available",
    },
    {
      id: uuid(), companyId: companies[1].id,
      title: "Peças Automotivas — SP para Curitiba",
      description: "Peças para montadora. Entrega urgente.",
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Curitiba", destinationState: "PR",
      weightKg: 2000, volumeM3: 10, type: "autopeças",
      pickupDate: "2026-07-10", deliveryDate: "2026-07-11", status: "available",
    },
    {
      id: uuid(), companyId: companies[0].id,
      title: "Tecidos — SP para RJ",
      description: "Rolos de tecido para confecção.",
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Rio de Janeiro", destinationState: "RJ",
      weightKg: 6000, volumeM3: 40, type: "têxtil",
      pickupDate: "2026-07-14", deliveryDate: "2026-07-15", status: "pending",
    },
    {
      id: uuid(), companyId: companies[0].id,
      title: "Material de Construção — SP para Campinas",
      description: "Entregue na semana passada.",
      originCity: "São Paulo", originState: "SP",
      destinationCity: "Campinas", destinationState: "SP",
      weightKg: 10000, volumeM3: 50, type: "construção",
      pickupDate: "2026-06-20", deliveryDate: "2026-06-20", status: "delivered",
    },
    {
      id: uuid(), companyId: companies[1].id,
      title: "Produtos Químicos — RJ para SP",
      description: "Cancelado por problemas regulatórios.",
      originCity: "Rio de Janeiro", originState: "RJ",
      destinationCity: "São Paulo", destinationState: "SP",
      weightKg: 8000, volumeM3: 35, type: "químicos",
      pickupDate: "2026-06-25", deliveryDate: "2026-06-27", status: "cancelled",
    },
  ];

  for (const l of loads) {
    await execute(
      `INSERT INTO loads (id, company_id, title, description, origin_city, origin_state, destination_city, destination_state, weight_kg, volume_m3, type, pickup_date, delivery_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, l.companyId, l.title, l.description, l.originCity, l.originState, l.destinationCity, l.destinationState, l.weightKg, l.volumeM3, l.type, l.pickupDate, l.deliveryDate, l.status]
    );
  }
  console.log(`  → ${loads.length} cargas criadas`);

  // ── 7. MATCHES ───────────────────────────────────────────
  console.log("🤝 Matches...");

  const match1Id = uuid();
  await execute(
    `INSERT INTO matches (id, load_id, driver_id, route_id, score, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [match1Id, loads[0].id, drivers[0].id, routes[0].id, 92, "accepted"]
  );
  await execute(`UPDATE loads SET status = 'matched'${IS_PG ? ", updated_at = NOW()" : ", updated_at = datetime('now')"} WHERE id = ?`, [loads[0].id]);

  const match2Id = uuid();
  await execute(
    `INSERT INTO matches (id, load_id, driver_id, route_id, score, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [match2Id, loads[2].id, drivers[1].id, routes[2].id, 78, "pending"]
  );

  const match3Id = uuid();
  await execute(
    `INSERT INTO matches (id, load_id, driver_id, route_id, score, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [match3Id, loads[3].id, drivers[0].id, routes[1].id, 85, "pending"]
  );

  console.log(`  → 3 matches criados`);

  // ── 8. MENSAGENS ─────────────────────────────────────────
  console.log("💬 Mensagens...");

  const messages = [
    { matchId: match1Id, senderId: users[3].id, content: "Olá! Vi que tenho uma rota compatível com sua carga. Posso transportar seus eletrônicos para Porto Alegre.", read: 1 },
    { matchId: match1Id, senderId: users[1].id, content: "Ótimo! O prazo de coleta é 11/07. Conseguiria buscar no dia pela manhã?", read: 1 },
    { matchId: match1Id, senderId: users[3].id, content: "Sim, sem problemas! Passo no endereço da Av. Paulista às 8h.", read: 1 },
    { matchId: match2Id, senderId: users[4].id, content: "Bom dia! Tenho rota saindo de Curitiba para BH com capacidade disponível. Seu lote de alimentos encaixa perfeitamente.", read: 0 },
    { matchId: match3Id, senderId: users[1].id, content: "Precisamos transportar peças automotivas de SP para Curitiba. Você tem retorno previsto para o dia 14?", read: 0 },
    { matchId: match3Id, senderId: users[3].id, content: "Tenho sim! Vou chegar em POA no dia 12 e sigo para SP no dia 14. Posso incluir sua carga no retorno.", read: 0 },
  ];

  for (const m of messages) {
    await execute(
      `INSERT INTO messages (id, match_id, sender_id, content, read)
       VALUES (?, ?, ?, ?, ?)`,
      [uuid(), m.matchId, m.senderId, m.content, m.read]
    );
  }
  console.log(`  → ${messages.length} mensagens criadas`);

  // ── 9. NOTIFICAÇÕES ──────────────────────────────────────
  console.log("🔔 Notificações...");

  const notifications = [
    { userId: users[1].id, type: "match", title: "Match confirmado!", message: "João Silva aceitou transportar sua carga 'Eletrônicos — SP para POA'. Acesse o chat para combinar os detalhes.", read: 0 },
    { userId: users[3].id, type: "match", title: "Match aceito!", message: "Sua proposta para transportar 'Eletrônicos — SP para POA' foi aceita pela Transportadora ABC.", read: 0 },
    { userId: users[1].id, type: "system", title: "Nova carga cadastrada", message: "Sua carga 'Móveis — SP para POA' foi cadastrada com sucesso e já está disponível para matching.", read: 0 },
    { userId: users[3].id, type: "match", title: "Nova oportunidade de carga!", message: "Encontramos uma carga compatível com sua rota SP→POA: 'Peças Automotivas — SP para Curitiba'.", read: 0 },
    { userId: users[4].id, type: "match", title: "Nova oportunidade de carga!", message: "Encontramos uma carga compatível com sua rota Curitiba→BH: 'Alimentos — RJ para BH'.", read: 0 },
    { userId: users[1].id, type: "message", title: "Nova mensagem no chat", message: "João Silva enviou uma mensagem sobre o match de 'Eletrônicos — SP para POA'.", read: 1 },
    { userId: users[3].id, type: "message", title: "Nova mensagem no chat", message: "Transportadora ABC respondeu sobre o match de 'Eletrônicos — SP para POA'.", read: 1 },
  ];

  for (const n of notifications) {
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, message, read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), n.userId, n.type, n.title, n.message, n.read]
    );
  }
  console.log(`  → ${notifications.length} notificações criadas`);

  // ── Summary ──────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Seed concluído com sucesso!");
  console.log("═══════════════════════════════════════════\n");
  console.log("📋 Credenciais de acesso:");
  console.log("   Admin:     admin@opencargo.com / 123456");
  console.log("   Empresa:   abc@transportadora.com / 123456");
  console.log("   Empresa:   contato@logisticabrasil.com / 123456");
  console.log("   Motorista: joao@motorista.com / 123456");
  console.log("   Motorista: maria@motorista.com / 123456");
  console.log("\n📊 Resumo:");
  console.log(`   👤 ${users.length} usuários`);
  console.log(`   🏢 ${companies.length} empresas`);
  console.log(`   👨‍✈️ ${drivers.length} motoristas`);
  console.log(`   🚛 ${vehicles.length} veículos`);
  console.log(`   🛣️  ${routes.length} rotas`);
  console.log(`   📦 ${loads.length} cargas`);
  console.log(`   🤝 3 matches`);
  console.log(`   💬 ${messages.length} mensagens`);
  console.log(`   🔔 ${notifications.length} notificações\n`);
  console.log(`💡 Banco: ${IS_PG ? "PostgreSQL" : "SQLite"}\n`);
}

// ── Main ───────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
🌱 OpenCargo — Seed Script

Popula o banco de dados com dados de exemplo realistas.
Funciona com SQLite e PostgreSQL automaticamente.

Uso:
  node scripts/seed.js            Insere dados
  node scripts/seed.js --reset    Remove dados existentes antes
  node scripts/seed.js --help     Mostra esta ajuda

Configuração:
  DATABASE_URL=file:./data/opencargo.db  → SQLite (dev)
  DATABASE_URL=postgres://user:pass@... → PostgreSQL (prod)

Comandos via npm (recomendado):
  cd backend
  npm run seed            Insere dados
  npm run seed:reset      Remove + insere dados
`);
  process.exit(0);
}

try {
  // Garante que as tabelas existem
  await initDatabase();

  if (args.includes("--reset")) {
    await resetDatabase();
  }

  await seed();
  await closePool?.();
  process.exit(0);
} catch (err) {
  console.error("\n❌ Erro ao executar seed:", err.message);
  console.error(err);
  await closePool?.();
  process.exit(1);
}
