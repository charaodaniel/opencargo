// ── OpenCargo — Testes de API ─────────────────────────
// Executar: node --test tests/api.test.js

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createTestApp, request, authRequest, registerUser, createTestData, cleanDatabase } from "./setup.js";

let app;

// ── Setup ─────────────────────────────────────────────
before(async () => {
  app = await createTestApp();
});

after(async () => {
  await app.close();
});

// ═══════════════════════════════════════════════════════
// Health Check
// ═══════════════════════════════════════════════════════
describe("Health Check", () => {
  it("GET /api/health deve retornar status ok", async () => {
    const res = await request(app, {
      method: "GET",
      url: "/api/health",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
    assert.ok(res.body.timestamp);
  });
});

// ═══════════════════════════════════════════════════════
// Auth
// ═══════════════════════════════════════════════════════
describe("Auth", () => {
  let companyToken;
  let companyUserId;

  before(() => cleanDatabase());

  it("POST /api/auth/register deve criar usuário company", async () => {
    const res = await request(app, {
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Transportadora XYZ",
        email: "xyz@teste.com",
        password: "Teste@123",
        role: "empresa",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, "empresa");
    assert.strictEqual(res.body.user.name, "Transportadora XYZ");
    companyToken = res.body.token;
    companyUserId = res.body.user.id;
  });

  it("POST /api/auth/register deve criar usuário driver", async () => {
    const res = await request(app, {
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "João Motorista",
        email: "joao@teste.com",
        password: "Teste@123",
        role: "motorista",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, "motorista");
  });

  it("POST /api/auth/register deve rejeitar e-mail duplicado", async () => {
    const res = await request(app, {
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Outra Empresa",
        email: "xyz@teste.com",
        password: "Teste@123",
        role: "empresa",
      },
    });

    assert.strictEqual(res.status, 500);
  });

  it("POST /api/auth/login deve autenticar com credenciais válidas", async () => {
    const res = await request(app, {
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "xyz@teste.com",
        password: "Teste@123",
      },
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, "xyz@teste.com");
  });

  it("POST /api/auth/login deve rejeitar senha inválida", async () => {
    const res = await request(app, {
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "xyz@teste.com",
        password: "senha_errada",
      },
    });

    assert.strictEqual(res.status, 401);
  });

  it("GET /api/auth/me deve retornar dados do usuário autenticado", async () => {
    const res = await authRequest(app, companyToken, {
      method: "GET",
      url: "/api/auth/me",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, companyUserId);
    assert.strictEqual(res.body.email, "xyz@teste.com");
  });

  it("GET /api/auth/me deve rejeitar sem token", async () => {
    const res = await request(app, {
      method: "GET",
      url: "/api/auth/me",
    });

    assert.strictEqual(res.status, 401);
  });
});

// ═══════════════════════════════════════════════════════
// Companies CRUD (com paginação)
// ═══════════════════════════════════════════════════════
describe("Companies CRUD", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Empresa CRUD",
      email: "crud@teste.com",
      password: "Teste@123",
      role: "empresa",
    });
    token = user.token;
  });

  it("POST /api/companies deve criar empresa", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/companies",
      payload: {
        name: "Empresa CRUD Ltda",
        document: "99888777000100",
        address: "Rua B, 200",
        city: "São Paulo",
        state: "SP",
        phone: "11977777777",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.name, "Empresa CRUD Ltda");
    assert.strictEqual(res.body.document, "99888777000100");
    assert.ok(res.body.id);
  });

  it("GET /api/companies deve listar empresas com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/companies",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.total >= 1);
    assert.ok(res.body.page >= 1);
    assert.ok(res.body.limit >= 1);
    assert.ok(res.body.totalPages >= 1);
  });

  it("GET /api/companies/:id deve buscar empresa por ID", async () => {
    const list = await authRequest(app, token, {
      method: "GET",
      url: "/api/companies",
    });
    const companyId = list.body.data[0].id;

    const res = await authRequest(app, token, {
      method: "GET",
      url: `/api/companies/${companyId}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, companyId);
  });

  it("GET /api/companies/:id retorna 404 para ID inexistente", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/companies/id-inexistente",
    });

    assert.strictEqual(res.status, 404);
  });

  it("PATCH /api/companies/:id deve atualizar empresa", async () => {
    const list = await authRequest(app, token, {
      method: "GET",
      url: "/api/companies",
    });
    const companyId = list.body.data[0].id;

    const res = await authRequest(app, token, {
      method: "PATCH",
      url: `/api/companies/${companyId}`,
      payload: { name: "Empresa Atualizada Ltda" },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, "Empresa Atualizada Ltda");
  });
});

// ═══════════════════════════════════════════════════════
// Drivers CRUD (com paginação)
// ═══════════════════════════════════════════════════════
describe("Drivers CRUD", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Motorista CRUD",
      email: "motorista-crud@teste.com",
      password: "Teste@123",
      role: "motorista",
    });
    token = user.token;
  });

  it("POST /api/drivers deve criar motorista", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/drivers",
      payload: {
        name: "Motorista CRUD",
        document: "98765432100",
        cnh: "9988776655",
        phone: "11966666666",
        city: "São Paulo",
        state: "SP",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.name, "Motorista CRUD");
  });

  it("GET /api/drivers deve listar motoristas com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/drivers",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.total >= 1);
  });

  it("GET /api/drivers/available deve listar motoristas disponíveis", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/drivers/available",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });
});

// ═══════════════════════════════════════════════════════
// Vehicles CRUD
// ═══════════════════════════════════════════════════════
describe("Vehicles CRUD", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Motorista Veículo",
      email: "veiculo@teste.com",
      password: "Teste@123",
      role: "motorista",
    });
    token = user.token;

    await authRequest(app, token, {
      method: "POST",
      url: "/api/drivers",
      payload: {
        name: "Motorista Veículo",
        document: "11122233396",
        cnh: "1234509876",
        phone: "11955555555",
        city: "São Paulo",
        state: "SP",
      },
    });
  });

  it("POST /api/vehicles deve criar veículo", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/vehicles",
      payload: {
        plate: "XYZ5678",
        model: "Volvo FH",
        year: 2024,
        capacityKg: 20000,
        capacityM3: 80,
        type: "carreta",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.plate, "XYZ5678");
    assert.strictEqual(res.body.model, "Volvo FH");
  });

  it("GET /api/vehicles deve listar veículos com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/vehicles",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it("POST /api/vehicles rejeita placa duplicada", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/vehicles",
      payload: {
        plate: "XYZ5678",
        model: "Outro Caminhão",
        capacityKg: 10000,
        capacityM3: 40,
      },
    });

    assert.strictEqual(res.status, 500);
  });

  it("DELETE /api/vehicles/:id deve remover veículo", async () => {
    const createRes = await authRequest(app, token, {
      method: "POST",
      url: "/api/vehicles",
      payload: {
        plate: "TMP9999",
        model: "Temp Vehicle",
        capacityKg: 5000,
        capacityM3: 20,
      },
    });

    const vehicleId = createRes.body.id;

    const delRes = await authRequest(app, token, {
      method: "DELETE",
      url: `/api/vehicles/${vehicleId}`,
    });

    assert.strictEqual(delRes.status, 204);
  });
});

// ═══════════════════════════════════════════════════════
// Routes CRUD
// ═══════════════════════════════════════════════════════
describe("Routes CRUD", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Motorista Rota",
      email: "rota@teste.com",
      password: "Teste@123",
      role: "motorista",
    });
    token = user.token;

    await authRequest(app, token, {
      method: "POST",
      url: "/api/drivers",
      payload: {
        name: "Motorista Rota",
        document: "55566677720",
        cnh: "5556667778",
        city: "São Paulo",
        state: "SP",
      },
    });

    await authRequest(app, token, {
      method: "POST",
      url: "/api/vehicles",
      payload: {
        plate: "RTA0001",
        model: "Route Truck",
        capacityKg: 10000,
        capacityM3: 50,
      },
    });
  });

  it("POST /api/routes deve criar rota", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/routes",
      payload: {
        originCity: "São Paulo",
        originState: "SP",
        destinationCity: "Rio de Janeiro",
        destinationState: "RJ",
        departureDate: "2026-08-01",
        arrivalDate: "2026-08-02",
        availableWeight: 5000,
        availableVolume: 25,
        isReturn: false,
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.origin_city, "São Paulo");
    assert.strictEqual(res.body.destination_city, "Rio de Janeiro");
    assert.strictEqual(res.body.status, "active");
  });

  it("GET /api/routes deve listar rotas com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/routes",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it("GET /api/routes/active deve listar rotas ativas", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/routes/active",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    res.body.data.forEach((r) => assert.strictEqual(r.status, "active"));
  });
});

// ═══════════════════════════════════════════════════════
// Loads CRUD
// ═══════════════════════════════════════════════════════
describe("Loads CRUD", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Empresa Carga",
      email: "carga@teste.com",
      password: "Teste@123",
      role: "empresa",
    });
    token = user.token;

    await authRequest(app, token, {
      method: "POST",
      url: "/api/companies",
      payload: {
        name: "Empresa Carga Ltda",
        document: "55443322000105",
        city: "São Paulo",
        state: "SP",
      },
    });
  });

  it("POST /api/loads deve criar carga", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/loads",
      payload: {
        title: "Produtos Diversos",
        description: "Carga de teste",
        originCity: "São Paulo",
        originState: "SP",
        destinationCity: "Belo Horizonte",
        destinationState: "MG",
        weightKg: 3000,
        volumeM3: 15,
        type: "geral",
        pickupDate: "2026-08-01",
        deliveryDate: "2026-08-05",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, "Produtos Diversos");
    assert.strictEqual(res.body.status, "pending");
  });

  it("GET /api/loads deve listar cargas com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/loads",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it("PATCH /api/loads/:id deve atualizar status para available", async () => {
    const list = await authRequest(app, token, {
      method: "GET",
      url: "/api/loads",
    });
    const loadId = list.body.data[0].id;

    const res = await authRequest(app, token, {
      method: "PATCH",
      url: `/api/loads/${loadId}`,
      payload: { status: "available" },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "available");
  });

  it("GET /api/loads/available deve listar cargas disponíveis", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/loads/available",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    res.body.data.forEach((l) => assert.strictEqual(l.status, "available"));
  });
});

// ═══════════════════════════════════════════════════════
// Matching + Chat (Fluxo completo)
// ═══════════════════════════════════════════════════════
describe("Matching + Chat (Fluxo Completo)", () => {
  let companyToken, driverToken, driverId;
  let loadId, routeId, matchId;

  before(async () => {
    cleanDatabase();
    const appData = await createTestData(app);
    companyToken = appData.company.token;
    driverToken = appData.driver.token;
    driverId = appData.driverId;

    // Cria carga para a empresa
    const loadRes = await authRequest(app, companyToken, {
      method: "POST",
      url: "/api/loads",
      payload: {
        title: "Carga para Matching",
        originCity: "São Paulo",
        originState: "SP",
        destinationCity: "Porto Alegre",
        destinationState: "RS",
        weightKg: 5000,
        volumeM3: 20,
        pickupDate: "2026-08-10",
        deliveryDate: "2026-08-15",
      },
    });
    loadId = loadRes.body.id;

    // Disponibiliza a carga
    await authRequest(app, companyToken, {
      method: "PATCH",
      url: `/api/loads/${loadId}`,
      payload: { status: "available" },
    });

    // Cria rota de retorno para o motorista
    const routeRes = await authRequest(app, driverToken, {
      method: "POST",
      url: "/api/routes",
      payload: {
        originCity: "Porto Alegre",
        originState: "RS",
        destinationCity: "São Paulo",
        destinationState: "SP",
        departureDate: "2026-08-16",
        arrivalDate: "2026-08-18",
        availableWeight: 10000,
        availableVolume: 40,
        isReturn: true,
      },
    });
    routeId = routeRes.body.id;
  });

  it("GET /api/matching/loads-for-driver/:id retorna cargas compatíveis", async () => {
    const res = await authRequest(app, driverToken, {
      method: "GET",
      url: `/api/matching/loads-for-driver/${driverId}`,
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.results));
    assert.ok(res.body.results.length >= 1);
    assert.strictEqual(res.body.results[0].load.title, "Carga para Matching");
    assert.ok(res.body.results[0].score >= 80, "Score deve ser >= 80 (rota perfeitamente alinhada)");
  });

  it("GET /api/matching/drivers-for-load/:id retorna motoristas compatíveis", async () => {
    const res = await authRequest(app, companyToken, {
      method: "GET",
      url: `/api/matching/drivers-for-load/${loadId}`,
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.results));
    assert.ok(res.body.results.length >= 1);
    assert.ok(res.body.results[0].driver);
    assert.ok(res.body.results[0].vehicle);
  });

  it("POST /api/matching cria match e atualiza status da carga", async () => {
    const res = await authRequest(app, companyToken, {
      method: "POST",
      url: "/api/matching",
      payload: {
        loadId,
        driverId,
        routeId,
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, "pending");
    matchId = res.body.id;

    // Verifica que a carga foi marcada como matched
    const loadRes = await authRequest(app, companyToken, {
      method: "GET",
      url: `/api/loads/${loadId}`,
    });
    assert.strictEqual(loadRes.body.status, "matched");
  });

  it("POST /api/chat/messages envia mensagem no match", async () => {
    const res = await authRequest(app, companyToken, {
      method: "POST",
      url: "/api/chat/messages",
      payload: {
        matchId,
        content: "Olá, tenho interesse na carga!",
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.content, "Olá, tenho interesse na carga!");
    assert.strictEqual(res.body.match_id, matchId);
  });

  it("GET /api/chat/messages/:matchId lista mensagens com paginação", async () => {
    const res = await authRequest(app, companyToken, {
      method: "GET",
      url: `/api/chat/messages/${matchId}`,
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
  });

  it("PATCH /api/matching/:id aceita o match", async () => {
    const res = await authRequest(app, companyToken, {
      method: "PATCH",
      url: `/api/matching/${matchId}`,
      payload: { status: "accepted" },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "accepted");
  });

  it("GET /api/matching lista todos os matches com paginação", async () => {
    const res = await authRequest(app, companyToken, {
      method: "GET",
      url: "/api/matching",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
  });
});

// ═══════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════
describe("Notifications", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Usuário Notificações",
      email: "notif@teste.com",
      password: "Teste@123",
      role: "empresa",
    });
    token = user.token;
  });

  it("GET /api/notifications lista notificações do usuário com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/notifications",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it("POST /api/notifications/read-all marca todas como lidas", async () => {
    const res = await authRequest(app, token, {
      method: "POST",
      url: "/api/notifications/read-all",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});

// ═══════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════
describe("Users", () => {
  let token;

  before(async () => {
    cleanDatabase();
    const user = await registerUser(app, {
      name: "Admin Teste",
      email: "admin@teste.com",
      password: "Teste@123",
      role: "empresa",
    });
    token = user.token;
  });

  it("GET /api/users lista usuários com paginação", async () => {
    const res = await authRequest(app, token, {
      method: "GET",
      url: "/api/users",
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.total >= 1);
  });

  it("GET /api/users/:id busca usuário por ID", async () => {
    const list = await authRequest(app, token, {
      method: "GET",
      url: "/api/users",
    });
    const userId = list.body.data[0].id;

    const res = await authRequest(app, token, {
      method: "GET",
      url: `/api/users/${userId}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, userId);
  });
});
