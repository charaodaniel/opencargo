import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

export async function matchingRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  const LOAD_TYPES = ["Carga Geral","Carga Frágil","Carga Frigorífica","Carga Perigosa","Granel"];

  const COMPATIBLE_TYPES = {
    "Carga Frigorífica": ["Refrigerado", "Frigorífico"],
    "Carga Perigosa": ["Tanque", "Cegonha"],
    "Granel": ["Basculante", "Graneleiro"],
    "Carga Frágil": ["Baú", "Sider"],
    "Carga Geral": ["Baú", "Sider", "Grade Baixa", "Graneleiro"],
  };

  function calculateScore({ load, route, vehicle }) {
    let score = 0;
    const reasons = [];

    if (load.origin_city === route.destination_city && load.destination_city === route.origin_city) {
      score += 50;
      reasons.push("Rotas perfeitamente alinhadas");
    } else {
      if (load.origin_city === route.destination_city || load.destination_city === route.origin_city) {
        score += 25;
        reasons.push("Rotas parcialmente alinhadas");
      }
      if (load.origin_state === route.destination_state && load.destination_state === route.origin_state) {
        score += 10;
        reasons.push("Estados alinhados");
      }
    }

    if (route.available_weight && load.weight_kg) {
      const weightRatio = load.weight_kg / route.available_weight;
      if (weightRatio <= 1) {
        score += Math.round(20 * (1 - Math.abs(0.7 - weightRatio) / 0.7));
        reasons.push("Peso compat\u00edvel");
      }
    } else { score += 10; }

    if (route.available_volume && load.volume_m3) {
      const volumeRatio = load.volume_m3 / route.available_volume;
      if (volumeRatio <= 1) {
        score += Math.round(10 * (1 - Math.abs(0.6 - volumeRatio) / 0.6));
        reasons.push("Volume compat\u00edvel");
      }
    } else { score += 5; }

    if (load.pickup_date && route.departure_date) {
      const diffDays = Math.abs(new Date(load.pickup_date) - new Date(route.departure_date)) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) { score += 10; reasons.push("Datas alinhadas"); }
      else if (diffDays <= 3) { score += 7; reasons.push("Datas pr\u00f3ximas"); }
      else if (diffDays <= 7) { score += 4; }
    } else { score += 5; }

    const vehicleType = vehicle?.type || vehicle?.vehicle_type;
    if (load.type && vehicleType) {
      const compat = COMPATIBLE_TYPES[load.type] || [];
      if (compat.some((t) => vehicleType.toLowerCase().includes(t.toLowerCase()))) {
        score += 10; reasons.push("Ve\u00edculo adequado ao tipo de carga");
      } else { score += 3; }
    } else { score += 5; }

    return { score: Math.min(100, Math.round(score)), reasons };
  }

  function buildFilters(queryParams, tableAlias, baseConditions = [], baseParams = []) {
    const t = tableAlias ? `${tableAlias}.` : "";
    const conditions = [...baseConditions];
    const params = [...baseParams];

    if (queryParams.originState) { conditions.push(`${t}origin_state = ?`); params.push(queryParams.originState.toUpperCase()); }
    if (queryParams.destinationState) { conditions.push(`${t}destination_state = ?`); params.push(queryParams.destinationState.toUpperCase()); }
    if (queryParams.weightMin) { conditions.push(`${t}weight_kg >= ?`); params.push(Number(queryParams.weightMin)); }
    if (queryParams.weightMax) { conditions.push(`${t}weight_kg <= ?`); params.push(Number(queryParams.weightMax)); }
    if (queryParams.dateFrom) { conditions.push(`${t}pickup_date >= ?`); params.push(queryParams.dateFrom); }
    if (queryParams.dateTo) { conditions.push(`${t}pickup_date <= ?`); params.push(queryParams.dateTo); }
    if (queryParams.loadType) { conditions.push(`${t}type = ?`); params.push(queryParams.loadType); }
    if (queryParams.q) {
      conditions.push(`(${t}title LIKE ? OR ${t}origin_city LIKE ? OR ${t}destination_city LIKE ?)`);
      const s = `%${queryParams.q}%`;
      params.push(s, s, s);
    }
    return { conditions, params };
  }

  // ═══════════════════════════════════════════════════════
  //  GET /matching/search — JOIN único, sem N+1
  // ═══════════════════════════════════════════════════════
  app.get("/search", async (request) => {
    const qp = request.query;
    const { page, limit, offset } = getPagination(request.query);
    const { conditions, params } = buildFilters(qp, "l", [
      "l.status = 'available'",
      "r.status = 'active'", "r.is_return = 1",
      "r.origin_city = l.destination_city",
      "r.destination_city = l.origin_city",
      "r.available_weight >= l.weight_kg",
    ]);

    const where = conditions.join(" AND ");
    // Aliases explicitos para evitar colisão l.* x r.*
    const select = `
      SELECT l.id AS load_id, l.company_id, l.title, l.description,
             l.origin_city AS load_origin_city, l.origin_state AS load_origin_state,
             l.destination_city AS load_dest_city, l.destination_state AS load_dest_state,
             l.weight_kg, l.volume_m3, l.type AS load_type,
             l.pickup_date, l.delivery_date, l.status AS load_status,
             r.id AS route_id, r.driver_id,
             r.origin_city AS route_origin_city, r.origin_state AS route_origin_state,
             r.destination_city AS route_dest_city, r.destination_state AS route_dest_state,
             r.departure_date, r.arrival_date,
             r.available_weight, r.available_volume, r.is_return, r.status AS route_status,
             d.name AS driver_name, d.city AS driver_city, d.state AS driver_state, d.phone AS driver_phone,
             v.model AS vehicle_model, v.type AS vehicle_type, v.capacity_kg AS vehicle_capacity_kg
      FROM loads l
      JOIN routes r ON r.origin_city = l.destination_city
                   AND r.destination_city = l.origin_city
                   AND r.is_return = 1 AND r.status = 'active'
                   AND r.available_weight >= l.weight_kg
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN vehicles v ON v.driver_id = r.driver_id
      WHERE ${where}`;

    const [[{ total }], rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM loads l JOIN routes r ON r.origin_city = l.destination_city AND r.destination_city = l.origin_city AND r.is_return = 1 AND r.status = 'active' AND r.available_weight >= l.weight_kg LEFT JOIN drivers d ON r.driver_id = d.id LEFT JOIN vehicles v ON v.driver_id = r.driver_id WHERE ${where}`, params),
      query(`${select} ORDER BY l.pickup_date ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    ]);

    const results = rows.map((r) => {
      const load = {
        id: r.load_id, company_id: r.company_id, title: r.title, description: r.description,
        origin_city: r.load_origin_city, origin_state: r.load_origin_state,
        destination_city: r.load_dest_city, destination_state: r.load_dest_state,
        weight_kg: r.weight_kg, volume_m3: r.volume_m3, type: r.load_type,
        pickup_date: r.pickup_date, delivery_date: r.delivery_date, status: r.load_status,
      };
      const route = {
        id: r.route_id, driver_id: r.driver_id,
        origin_city: r.route_origin_city, origin_state: r.route_origin_state,
        destination_city: r.route_dest_city, destination_state: r.route_dest_state,
        departure_date: r.departure_date, arrival_date: r.arrival_date,
        available_weight: r.available_weight, available_volume: r.available_volume,
        is_return: r.is_return, status: r.route_status,
        driver_name: r.driver_name, driver_city: r.driver_city,
        driver_state: r.driver_state, driver_phone: r.driver_phone,
        vehicle_model: r.vehicle_model, vehicle_type: r.vehicle_type,
        vehicle_capacity_kg: r.vehicle_capacity_kg,
      };
      const { score, reasons } = calculateScore({ load, route, vehicle: route });
      return { load, route, score, match_reasons: reasons };
    }).filter((r) => !qp.minScore || r.score >= Number(qp.minScore));

    if (qp.sortBy !== "date" && qp.sortBy !== "weight") results.sort((a, b) => b.score - a.score);

    return { results, total };
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching/loads-for-driver/:driverId
  // ═══════════════════════════════════════════════════════
  app.get("/loads-for-driver/:driverId", async (request) => {
    const { driverId } = request.params;
    const qp = request.query;
    const { page, limit, offset } = getPagination(request.query);

    const { conditions, params } = buildFilters(qp, "l", [
      "r.driver_id = ?", "r.status = 'active'",
      "l.status = 'available'",
      "l.origin_city = r.destination_city",
      "l.destination_city = r.origin_city",
      "l.weight_kg <= COALESCE(r.available_weight, 99999)",
      "l.pickup_date <= r.departure_date",
    ], [driverId]);

    const where = conditions.join(" AND ");
    const select = `
      SELECT l.id AS load_id, l.company_id, l.title, l.description,
             l.origin_city AS load_origin_city, l.origin_state AS load_origin_state,
             l.destination_city AS load_dest_city, l.destination_state AS load_dest_state,
             l.weight_kg, l.volume_m3, l.type AS load_type,
             l.pickup_date, l.delivery_date, l.status AS load_status,
             r.id AS route_id, r.driver_id,
             r.origin_city AS route_origin_city, r.origin_state AS route_origin_state,
             r.destination_city AS route_dest_city, r.destination_state AS route_dest_state,
             r.departure_date, r.arrival_date,
             r.available_weight, r.available_volume, r.is_return, r.status AS route_status,
             v.id AS vehicle_id, v.model AS vehicle_model, v.type AS vehicle_type,
             v.capacity_kg, v.plate
      FROM routes r
      JOIN loads l ON l.origin_city = r.destination_city
                  AND l.destination_city = r.origin_city
                  AND l.status = 'available'
                  AND l.weight_kg <= COALESCE(r.available_weight, 99999)
                  AND l.pickup_date <= r.departure_date
      LEFT JOIN vehicles v ON v.driver_id = r.driver_id
      WHERE ${where}`;

    const [[{ total }], rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM routes r JOIN loads l ON l.origin_city = r.destination_city AND l.destination_city = r.origin_city AND l.status = 'available' AND l.weight_kg <= COALESCE(r.available_weight, 99999) AND l.pickup_date <= r.departure_date LEFT JOIN vehicles v ON v.driver_id = r.driver_id WHERE ${where}`, params),
      query(`${select} ORDER BY l.pickup_date ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    ]);

    const matchesResult = rows.map((r) => {
      const load = {
        id: r.load_id, company_id: r.company_id, title: r.title, description: r.description,
        origin_city: r.load_origin_city, origin_state: r.load_origin_state,
        destination_city: r.load_dest_city, destination_state: r.load_dest_state,
        weight_kg: r.weight_kg, volume_m3: r.volume_m3, type: r.load_type,
        pickup_date: r.pickup_date, delivery_date: r.delivery_date, status: r.load_status,
      };
      const route = {
        id: r.route_id, driver_id: r.driver_id,
        origin_city: r.route_origin_city, origin_state: r.route_origin_state,
        destination_city: r.route_dest_city, destination_state: r.route_dest_state,
        departure_date: r.departure_date, arrival_date: r.arrival_date,
        available_weight: r.available_weight, available_volume: r.available_volume,
        is_return: r.is_return, status: r.route_status,
      };
      const vehicle = r.vehicle_id ? {
        id: r.vehicle_id, model: r.vehicle_model, type: r.vehicle_type,
        capacity_kg: r.capacity_kg, plate: r.plate,
      } : null;
      const { score, reasons } = calculateScore({ load, route, vehicle });
      return { route, load, score, match_reasons: reasons };
    }).filter((r) => !qp.minScore || r.score >= Number(qp.minScore));

    if (qp.sortBy === "date") {
      matchesResult.sort((a, b) => qp.sortOrder === "asc" ? new Date(a.load.pickup_date) - new Date(b.load.pickup_date) : new Date(b.load.pickup_date) - new Date(a.load.pickup_date));
    } else {
      matchesResult.sort((a, b) => b.score - a.score);
    }

    return { results: matchesResult, total };
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching/drivers-for-load/:loadId
  // ═══════════════════════════════════════════════════════
  app.get("/drivers-for-load/:loadId", async (request) => {
    const { loadId } = request.params;
    const qp = request.query;
    const { page, limit, offset } = getPagination(request.query);

    const load = await queryOne(`SELECT * FROM loads WHERE id = ?`, [loadId]);
    if (!load) throw { statusCode: 404, message: "Carga n\u00e3o encontrada" };

    const routeFilters = [];
    const routeParams = [];
    if (qp.originState) { routeFilters.push("r.origin_state = ?"); routeParams.push(qp.originState.toUpperCase()); }
    if (qp.destinationState) { routeFilters.push("r.destination_state = ?"); routeParams.push(qp.destinationState.toUpperCase()); }
    if (qp.dateFrom) { routeFilters.push("r.departure_date >= ?"); routeParams.push(qp.dateFrom); }
    if (qp.dateTo) { routeFilters.push("r.departure_date <= ?"); routeParams.push(qp.dateTo); }

    const allConditions = [
      "r.origin_city = ?", "r.destination_city = ?",
      "r.is_return = 1", "r.status = 'active'", "r.available_weight >= ?",
      ...routeFilters,
    ];
    const allParams = [load.destination_city, load.origin_city, load.weight_kg, ...routeParams];
    const where = allConditions.join(" AND ");

    const select = `
      SELECT r.*, d.name AS driver_name, d.city AS driver_city, d.state AS driver_state,
             d.phone AS driver_phone, v.model AS vehicle_model, v.type AS vehicle_type,
             v.capacity_kg AS vehicle_capacity_kg, v.plate AS vehicle_plate
      FROM routes r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN vehicles v ON v.driver_id = r.driver_id
      WHERE ${where}`;

    const [[{ total }], rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM routes r LEFT JOIN drivers d ON r.driver_id = d.id LEFT JOIN vehicles v ON v.driver_id = r.driver_id WHERE ${where}`, allParams),
      query(`${select} ORDER BY r.departure_date ASC LIMIT ? OFFSET ?`, [...allParams, limit, offset]),
    ]);

    const result = rows.map((r) => {
      const { score, reasons } = calculateScore({ load, route: r, vehicle: r });
      return {
        route: { id: r.id, driver_id: r.driver_id, origin_city: r.origin_city, origin_state: r.origin_state, destination_city: r.destination_city, destination_state: r.destination_state, departure_date: r.departure_date, arrival_date: r.arrival_date, available_weight: r.available_weight, available_volume: r.available_volume, is_return: r.is_return, status: r.status },
        driver: { id: r.driver_id, name: r.driver_name, city: r.driver_city, state: r.driver_state, phone: r.driver_phone },
        vehicle: { model: r.vehicle_model, type: r.vehicle_type, capacity_kg: r.vehicle_capacity_kg, plate: r.vehicle_plate },
        score, match_reasons: reasons,
      };
    }).filter((r) => !qp.minScore || r.score >= Number(qp.minScore));

    if (qp.sortBy === "date") {
      result.sort((a, b) => qp.sortOrder === "asc" ? new Date(a.route.departure_date) - new Date(b.route.departure_date) : new Date(b.route.departure_date) - new Date(a.route.departure_date));
    } else {
      result.sort((a, b) => b.score - a.score);
    }

    return { results: result, total };
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching/filters
  // ═══════════════════════════════════════════════════════
  app.get("/filters", async () => {
    const [states, types] = await Promise.all([
      query(`SELECT DISTINCT origin_state AS state FROM loads WHERE status = 'available' ORDER BY state`),
      query(`SELECT DISTINCT type FROM loads WHERE status = 'available' AND type IS NOT NULL ORDER BY type`),
    ]);
    return { states: states.map((s) => s.state).filter(Boolean), loadTypes: LOAD_TYPES, activeTypes: types.map((t) => t.type).filter(Boolean) };
  });

  // ═══════════════════════════════════════════════════════
  //  POST /matching — Criar match
  // ═══════════════════════════════════════════════════════
  app.post("/", async (request, reply) => {
    const { loadId, driverId, routeId } = request.body;
    const id = uuid();
    await query(`INSERT INTO matches (id, load_id, driver_id, route_id, score, status) VALUES (?, ?, ?, ?, 100, 'pending')`, [id, loadId, driverId, routeId]);
    await query(`UPDATE loads SET status = 'matched' WHERE id = ?`, [loadId]);
    const match = await queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
    return reply.status(201).send(match);
  });

  // ═══════════════════════════════════════════════════════
  //  GET /matching — Listar matches (paginated) com dados do motorista e carga
  // ═══════════════════════════════════════════════════════
  app.get("/", async (request) => {
    const { page, limit, offset } = getPagination(request.query);
    const [rows, [{ total }]] = await Promise.all([
      query(`
        SELECT m.*, d.name AS driver_name, l.title AS load_title
        FROM matches m
        LEFT JOIN drivers d ON m.driver_id = d.id
        LEFT JOIN loads l ON m.load_id = l.id
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]),
      query(`SELECT COUNT(*) AS total FROM matches`),
    ]);
    return paginatedResponse(rows, total, page, limit);
  });

  // ═══════════════════════════════════════════════════════
  //  PATCH /matching/:id
  // ═══════════════════════════════════════════════════════
  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const { status } = request.body;
    await query(`UPDATE matches SET status = ? WHERE id = ?`, [status, id]);
    return await queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
  });
}
