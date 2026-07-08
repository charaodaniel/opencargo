// ═══════════════════════════════════════════════════════════
// OpenCargo — E2E: Teste de Cadastro via API
// ═══════════════════════════════════════════════════════════
//
// Testa o fluxo completo de registro de usuário via API
// no backend do Railway ou local.
//
// Uso:
//   node backend/tests/e2e-register.mjs
//
// Para testar contra ambiente específico:
//   API_URL=https://opencargo-production.up.railway.app/api node backend/tests/e2e-register.mjs
//
// ═══════════════════════════════════════════════════════════

const API_URL = process.env.API_URL || "https://opencargo-production.up.railway.app/api";
const TEST_EMAIL = `teste-${Date.now()}@opencargo.com`;
const TEST_PASSWORD = "123456";
const TEST_NAME = "Usuário Teste E2E";

let passed = 0;
let failed = 0;

async function assert(condition, description) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.log(`  ❌ ${description}`);
    failed++;
  }
}

async function run() {
  console.log("═══════════════════════════════════════════════");
  console.log(`  OpenCargo — E2E: Cadastro de Usuário`);
  console.log(`  API: ${API_URL}`);
  console.log("═══════════════════════════════════════════════\n");

  // ── 0. Verificar conectividade ──────────────────────────
  console.log("📡 0. Health Check");
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    await assert(healthRes.status === 200, "GET /api/health → 200");
    await assert(health.status === "ok", `status === "ok"`);
  } catch (err) {
    console.log(`  ❌ Health check falhou — API offline? ${err.message}`);
    failed++;
    console.log("\n  ⚠️  Teste interrompido: API não respondeu.");
    printSummary();
    process.exit(1);
  }
  console.log("");

  // ── 1. Registrar usuário empresa ─────────────────────────
  console.log("📝 1. Registrar nova empresa");
  try {
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        role: "empresa",
      }),
    });

    const registerData = await registerRes.json();

    if (registerRes.status === 201) {
      await assert(true, "POST /api/auth/register → 201");
      await assert(!!registerData.token, "Token JWT retornado");
      await assert(registerData.user.name === TEST_NAME, `Nome: "${registerData.user.name}"`);
      await assert(registerData.user.email === TEST_EMAIL, `Email: "${registerData.user.email}"`);
      await assert(registerData.user.role === "empresa", `Role: "empresa"`);
      await assert(
        registerData.token.split(".").length === 3,
        "Token JWT tem 3 segmentos (válido)"
      );

      const token = registerData.token;

      // ── 2. Verificar token via /me ─────────────────────────
      console.log("\n🔑 2. Verificar token (/me)");
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();

      if (meRes.status === 200) {
        await assert(true, "GET /api/auth/me → 200");
        await assert(meData.email === TEST_EMAIL, `Email no /me: "${meData.email}"`);
        await assert(meData.role === "empresa", `Role no /me: "${meData.role}"`);
        await assert(!!meData.id, "ID do usuário presente");
      } else {
        await assert(false, `GET /api/auth/me → ${meRes.status}: ${JSON.stringify(meData)}`);
      }

      // ── 3. /me sem token deve falhar ───────────────────────
      console.log("\n🔒 3. /me sem token (deve falhar)");
      const noAuthRes = await fetch(`${API_URL}/auth/me`);
      await assert(noAuthRes.status === 401, "GET /api/auth/me sem token → 401");

    } else {
      await assert(false, `POST /api/auth/register → ${registerRes.status}: ${JSON.stringify(registerData)}`);
    }
  } catch (err) {
    console.log(`  ❌ Erro no registro: ${err.message}`);
    failed++;
  }
  console.log("");

  // ── 4. Login com o novo usuário ──────────────────────────
  console.log("🔐 4. Login com o novo usuário");
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const loginData = await loginRes.json();

    if (loginRes.status === 200) {
      await assert(true, "POST /api/auth/login → 200");
      await assert(!!loginData.token, "Novo token retornado no login");
      await assert(loginData.user.email === TEST_EMAIL, `Email coincide: "${loginData.user.email}"`);
      await assert(loginData.user.role === "empresa", `Role coincide: "empresa"`);
      await assert(!!loginData.user.id, "ID do usuário presente");
    } else {
      await assert(false, `POST /api/auth/login → ${loginRes.status}: ${JSON.stringify(loginData)}`);
    }
  } catch (err) {
    console.log(`  ❌ Erro no login: ${err.message}`);
    failed++;
  }
  console.log("");

  // ── 5. Login com senha errada deve falhar ────────────────
  console.log("🚫 5. Login com senha inválida (deve falhar)");
  try {
    const wrongRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "senha_errada_123",
      }),
    });
    await assert(wrongRes.status === 401, `Login inválido → ${wrongRes.status}`);
  } catch (err) {
    console.log(`  ❌ Erro: ${err.message}`);
    failed++;
  }
  console.log("");

  // ── 6. Registrar usuário motorista ───────────────────────
  const driverEmail = `motorista-${Date.now()}@opencargo.com`;
  console.log("🚛 6. Registrar novo motorista");
  try {
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Motorista Teste E2E",
        email: driverEmail,
        password: TEST_PASSWORD,
        role: "motorista",
      }),
    });

    const registerData = await registerRes.json();

    if (registerRes.status === 201) {
      await assert(true, "POST /api/auth/register (motorista) → 201");
      await assert(registerData.user.role === "motorista", `Role: "motorista"`);
      await assert(registerData.user.email === driverEmail, `Email: "${driverEmail}"`);
    } else {
      await assert(false, `POST /api/auth/register (motorista) → ${registerRes.status}: ${JSON.stringify(registerData)}`);
    }
  } catch (err) {
    console.log(`  ❌ Erro no registro do motorista: ${err.message}`);
    failed++;
  }
  console.log("");

  // ── 7. Rejeitar e-mail duplicado (>= 400) ────────────────
  console.log("📧 7. Rejeitar e-mail duplicado");
  try {
    const dupRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicado",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        role: "empresa",
      }),
    });
    await assert(dupRes.status >= 400, `HTTP ${dupRes.status} (>= 400) para email duplicado`);
  } catch (err) {
    console.log(`  ❌ Erro: ${err.message}`);
    failed++;
  }
  console.log("");

  // ── 8. Registrar com role inválida deve falhar ───────────
  console.log("⚠️  8. Registrar com role inválida (deve falhar)");
  try {
    const invalidRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Role Inválido",
        email: `invalido-${Date.now()}@opencargo.com`,
        password: "123456",
        role: "admin", // role inválido
      }),
    });
    await assert(invalidRes.status >= 400, `HTTP ${invalidRes.status} (>= 400) para role inválido`);
  } catch (err) {
    console.log(`  ❌ Erro: ${err.message}`);
    failed++;
  }
  console.log("");

  // ── Resumo ───────────────────────────────────────────────
  printSummary();
}

function printSummary() {
  const total = passed + failed;
  console.log("═══════════════════════════════════════════════");
  console.log(`  Total: ${total} testes`);
  console.log(`  ✅ ${passed} passaram`);
  console.log(`  ❌ ${failed} falharam`);
  console.log("═══════════════════════════════════════════════\n");
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
