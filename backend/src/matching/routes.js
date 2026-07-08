import { query, queryOne, uuid } from "../common/database.js";

export async function matchingRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  // ─── Tipos de carga disponíveis ──────────────────────────
  const LOAD_TYPES = [
    "Carga Geral",
    "Carga Frágil",
    "Carga Frigorífica",
    "Carga Perigosa",
    "Granel",
  ];

  // ─── Algoritmo de Score ─────────────────────────────────
  // Calcula pontuação de compatibilidade (0-100)
  function calculateScore({ load, route, vehicle }) {
    let score = 0;
    const reasons = [];

    // 1. Cidades correspondem (critério eliminatório)
    if (load.origin_city === route.destination_city &&
        load.destination_city === route.origin_city) {
      score += 50;
      reasons.push("Rotas perfeitamente alinhadas");
    } else {
      // Correspondência parcial: pelo menos um dos pares combina
      if (load.origin_city === route.destination_city ||
          load.destination_city === route.origin_city) {
        score += 25;
        reasons.push("Rotas parcialmente alinhadas");
      }
      // Mesmo estado é melhor que nada
      if (load.origin_state === route.destination_state &&
          load.destination_state === route.origin_state) {
        score += 10;
        reasons.push("Estados alinhados");
      }
    }

    // 2. Compatibilidade de peso (0-20 pontos)
    if (route.available_weight && load.weight_kg) {
      const weightRatio = load.weight_kg / route.available_weight;
      if (weightRatio <= 1) {
        // Quanto mais próximo da capacidade, melhor aproveitamento
        score += Math.round(20 * (1 - Math.abs(0.7 - weightRatio) / 0.7));
        reasons.push("Peso compatível");
      }
    } else {
      score += 10; // Sem dados de peso, score parcial
    }

    // 3. Compatibilidade de volume (0-10 pontos)
    if (route.available_volume && load.volume_m3) {
      const volumeRatio = load.volume_m3 / route.available_volume;
      if (volumeRatio <= 1) {
        score += Math.round(10 * (1 - Math.abs(0.6 - volumeRatio) / 0.6));
        reasons.push("Volume compatível");
      }
    } else {
      score += 5;
    }

    // 4. Proximidade de datas (0-10 pontos)
    if (load.pickup_date && route.departure_date) {
      const loadDate = new Date(load.pickup_date).getTime();
      const routeDate = new Date(route.departure_date).getTime();
      const diffDays = Math.abs(loadDate - routeDate) / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        score += 10;
        reasons.push("Datas alinhadas");
      } else if (diffDays <= 3) {
        score += 7;
        reasons.push("Datas próximas");
      } else if (diffDays <= 7) {
        score += 4;
      }
    } else {
      score += 5;
    }

    // 5. Tipo de carga vs tipo de veículo (0-10 pontos)
    // Normaliza acesso ao tipo: pode vir como `type` (vehicles direto) ou `vehicle_type` (JOIN query)
    const vehicleType = vehicle?.type || vehicle?.vehicle_type;
    if (load.type && vehicleType) {
      const compatibleTypes = {
        "Carga Frigorífica": ["Refrigerado", "Frigorífico"],
        "Carga Perigosa": ["Tanque", "Cegonha"],
        "Granel": ["Basculante", "Graneleiro"],
        "Carga Frágil": ["Baú", "Sider"],
        "Carga Geral": ["Baú", "Sider", "Grade Baixa", "Graneleiro"],
      };

      const compat = compatibleTypes[load.type] || [];
      if (compat.some((t) => vehicleType.toLowerCase().includes(t.toLowerCase()))) {
        score += 10;
        reasons.push("Veículo adequado ao tipo de carga");
      } else {
        score += 3;
      }
    } else {
      score += 5;
    }

    return {
      score: Math.min(100, Math.round(score)),
      reasons,
    };
  }

  // ─── Constrói WHERE dinâmico para filtros ───────────────
  function buildFilters(queryParams, baseConditions = [], baseParams = []) {
    const conditions = [...baseConditions];
    const params = [...baseParams];

    if (queryParams.originState) {
      conditions.push("origin_state = ?");
      params.push(queryParams.originState.toUpperCase());
    }
    if (queryParams.destinationState) {
      conditions.push("destination_state = ?");
      params.push(queryParams.destinationState.toUpperCase());
    }
    if (queryParams.weightMin) {
      conditions.push("weight_kg >= ?");
      params.push(Number(queryParams.weightMin));
    }
    if (queryParams.weightMax) {
      conditions.push("weight_kg <= ?");
      params.push(Number(queryParams.weightMax));
    }
    if (queryParams.dateFrom) {
      conditions.push("pickup_date >= ?");
      params.push(queryParams.dateFrom);
    }
    if (queryParams.dateTo) {
      conditions.push("pickup_date <= ?");
      params.push(queryParams.dateTo);
    }
    if (queryParams.loadType) {
      conditions.push("type = ?");
      params.push(queryParams.loadType);
    }
    if (queryParams.q) {
      conditions.push("(title LIKE ? OR origin_city LIKE ? OR destination_city LIKE ?)");
      const searchTerm = `%${queryParams.q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    return { conditions, params };
  }

  // ─── Ordenação ──────────────────────────────────────────
  function buildOrderBy(queryParams, defaultSort = "score DESC") {
    const sortMap = {
      score: "score",
      date: "pickup_date",
      weight: "weight_kg",
      created: "created_at",
    };
    // Nota: score é calculado em JS, não ordenável no SQL
    if (queryParams.sortBy === "score") return defaultSort;

    const sortField = sortMap[queryParams.sortBy];
    if (!sortField) return defaultSort;

    const order = queryParams.sortOrder === "asc" ? "ASC" : "DESC";
    return `${sortField} ${order}`;
  }

  // ═══════════════════════════════════════════════════════
  //  GET /matching/search — Busca avançada com filtros
  // ═══════════════════════════════════════════════════════
  app.get("/search", async (request) => {
    const queryParams = request.query;
    const { type = "loads" } = queryParams;

    if (type === "loads") {
      // ── Busca cargas disponíveis com filtros ────────
      const { conditions, params } = buildFilters(queryParams, [
        "status = 'available'",
      ]);

      const sql = `SELECT * FROM loads WHERE ${conditions.join(" AND ")} ORDER BY ${buildOrderBy(queryParams, "pickup_date ASC")}`;

      const loads = await query(sql, params);

      // Encontra rotas de retorno compatíveis para cada carga
      const results = [];
      for (const load of loads) {
        const compatibleRoutes = await query(
          `SELECT r.*, d.name as driver_name, d.city as driver_city, d.state as driver_state, d.phone as driver_phone,
                  v.model as vehicle_model, v.type as vehicle_type, v.capacity_kg as vehicle_capacity_kg
           FROM routes r
           LEFT JOIN drivers d ON r.driver_id = d.id
           LEFT JOIN vehicles v ON v.driver_id = r.driver_id
           WHERE r.origin_city = ? AND r.destination_city = ?
             AND r.is_return = 1 AND r.status = 'active'
             AND r.available_weight >= ?`,
          [load.destination_city, load.origin_city, load.weight_kg]
        );

        for (const route of compatibleRoutes) {
          const { score, reasons } = calculateScore({
            load,
            route,
            vehicle: route,
          });

          // Filtro por score mínimo
          if (queryParams.minScore && score < Number(queryParams.minScore)) {
            continue;
          }

          results.push({
            load,
            route: {
              id: route.id,
              driver_id: route.driver_id,
              origin_city: route.origin_city,
              origin_state: route.origin_state,
              destination_city: route.destination_city,
              destination_state: route.destination_state,
              departure_date: route.departure_date,
              arrival_date: route.arrival_date,
              available_weight: route.available_weight,
              available_volume: route.available_volume,
              is_return: route.is_return,
              status: route.status,
              driver_name: route.driver_name,
              driver_city: route.driver_city,
              driver_state: route.driver_state,
              driver_phone: route.driver_phone,
              vehicle_model: route.vehicle_model,
              vehicle_type: route.vehicle_type,
              vehicle_capacity_kg: route.vehicle_capacity_kg,
            },
            score,
            match_reasons: reasons,
          });
        }
      }

      // Ordena por score (desc) ou pelo critério escolhido
      if (queryParams.sortBy !== "date" && queryParams.sortBy !== "weight") {
        results.sort((a, b) => b.score - a.score);
      }

      return {
        results,
        total: results.length,
        filters: { type: "loads", ...queryParams },
      };
    } else {
      // ── Busca motoristas compatíveis com filtros ────
      const { conditions, params } = buildFilters(queryParams, [
        "status = 'available'",
      ]);

      const sql = `SELECT * FROM loads WHERE ${conditions.join(" AND ")} ORDER BY ${buildOrderBy(queryParams, "pickup_date ASC")}`;
      const loads = await query(sql, params);

      const results = [];
      for (const load of loads) {
        const compatibleRoutes = await query(
          `SELECT r.*, d.name as driver_name, d.city as driver_city, d.state as driver_state, d.phone as driver_phone,
                  v.model as vehicle_model, v.type as vehicle_type, v.capacity_kg as vehicle_capacity_kg, v.plate as vehicle_plate
           FROM routes r
           LEFT JOIN drivers d ON r.driver_id = d.id
           LEFT JOIN vehicles v ON v.driver_id = r.driver_id
           WHERE r.origin_city = ? AND r.destination_city = ?
             AND r.is_return = 1 AND r.status = 'active'
             AND r.available_weight >= ?`,
          [load.destination_city, load.origin_city, load.weight_kg]
        );

        for (const route of compatibleRoutes) {
          const { score, reasons } = calculateScore({
            load,
            route,
            vehicle: route,
          });

          if (queryParams.minScore && score < Number(queryParams.minScore)) {
            continue;
          }

          results.push({
            load: {
              id: load.id,
              title: load.title,
              description: load.description,
              origin_city: load.origin_city,
              origin_state: load.origin_state,
              destination_city: load.destination_city,
              destination_state: load.destination_state,
              weight_kg: load.weight_kg,
              volume_m3: load.volume_m3,
              type: load.type,
              pickup_date: load.pickup_date,
              delivery_date: load.delivery_date,
              company_id: load.company_id,
            },
            driver: {
              id: route.driver_id,
              name: route.driver_name,
              city: route.driver_city,
              state: route.driver_state,
              phone: route.driver_phone,
            },
            vehicle: {
              model: route.vehicle_model,
              type: route.vehicle_type,
              capacity_kg: route.vehicle_capacity_kg,
              plate: route.vehicle_plate,
            },
            route: {
              id: route.id,
              departure_date: route.departure_date,
              arrival_date: route.arrival_date,
              available_weight: route.available_weight,
              available_volume: route.available_volume,
            },
            score,
            match_reasons: reasons,
          });
        }
      }

      if (queryParams.sortBy !== "date" && queryParams.sortBy !== "weight") {
        results.sort((a, b) => b.score - a.score);
      }

      return {
        results,
        total: results.length,
        filters: { type: "drivers", ...queryParams },
      };
    }
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching/loads-for-driver/:driverId — com filtros opcionais
  // ═══════════════════════════════════════════════════════
  app.get("/loads-for-driver/:driverId", async (request) => {
    const { driverId } = request.params;
    const queryParams = request.query;

    const driverRoutes = await query(
      `SELECT * FROM routes WHERE driver_id = ? AND status = 'active'`,
      [driverId]
    );

    const matchesResult = [];

    for (const route of driverRoutes) {
      const baseConditions = [
        "origin_city = ?",
        "destination_city = ?",
        "status = 'available'",
        "weight_kg <= ?",
        "pickup_date <= ?",
      ];
      const baseParams = [
        route.destination_city,
        route.origin_city,
        route.available_weight || 99999,
        route.departure_date,
      ];

      const { conditions, params } = buildFilters(queryParams, baseConditions, baseParams);

      const compatibleLoads = await query(
        `SELECT * FROM loads WHERE ${conditions.join(" AND ")}`,
        params
      );

      for (const load of compatibleLoads) {
        const vehicle = await queryOne(
          `SELECT * FROM vehicles WHERE driver_id = ?`,
          [driverId]
        );

        const { score, reasons } = calculateScore({ load, route, vehicle });

        if (queryParams.minScore && score < Number(queryParams.minScore)) {
          continue;
        }

        matchesResult.push({
          route,
          load,
          score,
          match_reasons: reasons,
        });
      }
    }

    // Ordenação
    if (queryParams.sortBy === "weight") {
      matchesResult.sort((a, b) =>
        queryParams.sortOrder === "asc"
          ? a.load.weight_kg - b.load.weight_kg
          : b.load.weight_kg - a.load.weight_kg
      );
    } else if (queryParams.sortBy === "date") {
      matchesResult.sort((a, b) =>
        queryParams.sortOrder === "asc"
          ? new Date(a.load.pickup_date) - new Date(b.load.pickup_date)
          : new Date(b.load.pickup_date) - new Date(a.load.pickup_date)
      );
    } else {
      matchesResult.sort((a, b) => b.score - a.score);
    }

    return {
      results: matchesResult,
      total: matchesResult.length,
    };
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching/drivers-for-load/:loadId — com filtros opcionais
  // ═══════════════════════════════════════════════════════
  app.get("/drivers-for-load/:loadId", async (request) => {
    const { loadId } = request.params;
    const queryParams = request.query;

    const load = await queryOne(`SELECT * FROM loads WHERE id = ?`, [loadId]);

    if (!load) {
      throw { statusCode: 404, message: "Carga não encontrada" };
    }

    const baseConditions = [
      "origin_city = ?",
      "destination_city = ?",
      "is_return = 1",
      "status = 'active'",
      "available_weight >= ?",
    ];
    const baseParams = [
      load.destination_city,
      load.origin_city,
      load.weight_kg,
    ];

    // Filtros adicionais para rotas
    const routeFilters = [];
    const routeParams = [];

    if (queryParams.originState) {
      routeFilters.push("origin_state = ?");
      routeParams.push(queryParams.originState.toUpperCase());
    }
    if (queryParams.destinationState) {
      routeFilters.push("destination_state = ?");
      routeParams.push(queryParams.destinationState.toUpperCase());
    }
    if (queryParams.dateFrom) {
      routeFilters.push("departure_date >= ?");
      routeParams.push(queryParams.dateFrom);
    }
    if (queryParams.dateTo) {
      routeFilters.push("departure_date <= ?");
      routeParams.push(queryParams.dateTo);
    }

    const allConditions = [...baseConditions, ...routeFilters];
    const allParams = [...baseParams, ...routeParams];

    const compatibleRoutes = await query(
      `SELECT r.*, d.name as driver_name, d.city as driver_city, d.state as driver_state, d.phone as driver_phone,
              v.model as vehicle_model, v.type as vehicle_type, v.capacity_kg as vehicle_capacity_kg, v.plate as vehicle_plate
       FROM routes r
       LEFT JOIN drivers d ON r.driver_id = d.id
       LEFT JOIN vehicles v ON v.driver_id = r.driver_id
       WHERE ${allConditions.join(" AND ")}`,
      allParams
    );

    const result = [];
    for (const route of compatibleRoutes) {
      const { score, reasons } = calculateScore({ load, route, vehicle: route });

      if (queryParams.minScore && score < Number(queryParams.minScore)) {
        continue;
      }

      result.push({
        route: {
          id: route.id,
          driver_id: route.driver_id,
          origin_city: route.origin_city,
          origin_state: route.origin_state,
          destination_city: route.destination_city,
          destination_state: route.destination_state,
          departure_date: route.departure_date,
          arrival_date: route.arrival_date,
          available_weight: route.available_weight,
          available_volume: route.available_volume,
          is_return: route.is_return,
          status: route.status,
        },
        driver: {
          id: route.driver_id,
          name: route.driver_name,
          city: route.driver_city,
          state: route.driver_state,
          phone: route.driver_phone,
        },
        vehicle: {
          model: route.vehicle_model,
          type: route.vehicle_type,
          capacity_kg: route.vehicle_capacity_kg,
          plate: route.vehicle_plate,
        },
        score,
        match_reasons: reasons,
      });
    }

    // Ordenação
    if (queryParams.sortBy === "date") {
      result.sort((a, b) =>
        queryParams.sortOrder === "asc"
          ? new Date(a.route.departure_date) - new Date(b.route.departure_date)
          : new Date(b.route.departure_date) - new Date(a.route.departure_date)
      );
    } else {
      result.sort((a, b) => b.score - a.score);
    }

    return {
      results: result,
      total: result.length,
    };
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching/filters — Retorna opções de filtro disponíveis
  // ═══════════════════════════════════════════════════════
  app.get("/filters", async () => {
    const [states, types] = await Promise.all([
      query(`SELECT DISTINCT origin_state as state FROM loads WHERE status = 'available' ORDER BY state`),
      query(`SELECT DISTINCT type FROM loads WHERE status = 'available' AND type IS NOT NULL ORDER BY type`),
    ]);

    return {
      states: states.map((s) => s.state).filter(Boolean),
      loadTypes: LOAD_TYPES,
      activeTypes: types.map((t) => t.type).filter(Boolean),
    };
  });

  // ═══════════════════════════════════════════════════════
  //  POST /matching — Criar match
  // ═══════════════════════════════════════════════════════
  app.post("/", async (request, reply) => {
    const { loadId, driverId, routeId } = request.body;

    const id = uuid();
    await query(
      `INSERT INTO matches (id, load_id, driver_id, route_id, score, status)
       VALUES (?, ?, ?, ?, 100, 'pending')`,
      [id, loadId, driverId, routeId]
    );

    await query(`UPDATE loads SET status = 'matched' WHERE id = ?`, [loadId]);

    const match = await queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
    return reply.status(201).send(match);
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching — Listar matches
  // ═══════════════════════════════════════════════════════
  app.get("/", async () => {
    return await query(`SELECT * FROM matches`);
  });

  // ═══════════════════════════════════════════════════════
  //  PATCH /matching/:id — Atualizar status do match
  // ═══════════════════════════════════════════════════════
  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const { status } = request.body;

    await query(`UPDATE matches SET status = ? WHERE id = ?`, [status, id]);

    return await queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
  });
}
