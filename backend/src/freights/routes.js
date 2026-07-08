// ── OpenCargo — Freight History Routes ────────────────────
// Histórico completo de fretes realizados — agrega dados de
// matches, cargas, motoristas, empresas, rotas e avaliações.
//
// endpoints:
//   GET /api/freights/history — Histórico completo com filtros
//   GET /api/freights/stats   — Estatísticas agregadas

import { query } from "../common/database.js";

export async function freightRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  // ═══════════════════════════════════════════════════════
  //  GET /freights/history — Histórico de fretes
  //  Query params: status, dateFrom, dateTo, q, role, userId
  // ═══════════════════════════════════════════════════════
  app.get("/history", async (request) => {
    const { status, dateFrom, dateTo, q, role, userId } = request.query;

    let sql = `
      SELECT
        m.id as match_id,
        m.score,
        m.status as match_status,
        m.created_at as match_created_at,

        l.id as load_id,
        l.title as load_title,
        l.description as load_description,
        l.origin_city as load_origin_city,
        l.origin_state as load_origin_state,
        l.destination_city as load_destination_city,
        l.destination_state as load_destination_state,
        l.weight_kg as load_weight_kg,
        l.volume_m3 as load_volume_m3,
        l.type as load_type,
        l.pickup_date,
        l.delivery_date,
        l.status as load_status,

        d.id as driver_id,
        d.name as driver_name,
        d.phone as driver_phone,
        d.city as driver_city,
        d.state as driver_state,

        c.id as company_id,
        c.name as company_name,
        c.city as company_city,
        c.state as company_state,

        r.id as route_id,
        r.origin_city as route_origin_city,
        r.origin_state as route_origin_state,
        r.destination_city as route_destination_city,
        r.destination_state as route_destination_state,
        r.departure_date,
        r.arrival_date,

        v.model as vehicle_model,
        v.type as vehicle_type,
        v.plate as vehicle_plate,

        (SELECT ROUND(AVG(score), 1) FROM reviews WHERE reviewee_id = du.id) as driver_avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = du.id) as driver_total_reviews,
        (SELECT ROUND(AVG(score), 1) FROM reviews WHERE reviewee_id = cu.id) as company_avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = cu.id) as company_total_reviews

      FROM matches m
      JOIN loads l ON m.load_id = l.id
      JOIN drivers d ON m.driver_id = d.id
      JOIN companies c ON l.company_id = c.id
      JOIN routes r ON m.route_id = r.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN users cu ON c.user_id = cu.id
    `;

    const conditions = [];
    const params = [];

    // Filtro por status do match
    if (status) {
      conditions.push("m.status = ?");
      params.push(status);
    }

    // Filtro por período
    if (dateFrom) {
      conditions.push("l.pickup_date >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("l.delivery_date <= ?");
      params.push(dateTo);
    }

    // Filtro por busca textual
    if (q) {
      conditions.push("(l.title LIKE ? OR d.name LIKE ? OR c.name LIKE ? OR l.origin_city LIKE ? OR l.destination_city LIKE ?)");
      const term = `%${q}%`;
      params.push(term, term, term, term, term);
    }

    // Filtro por papel do usuário
    if (userId && role === "driver") {
      conditions.push("d.user_id = ?");
      params.push(userId);
    } else if (userId && role === "company") {
      conditions.push("c.user_id = ?");
      params.push(userId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY m.created_at DESC";

    const rows = await query(sql, params);

    // Formata resultado
    return rows.map((row) => ({
      match: {
        id: row.match_id,
        score: row.score,
        status: row.match_status,
        created_at: row.match_created_at,
      },
      load: {
        id: row.load_id,
        title: row.load_title,
        description: row.load_description,
        origin_city: row.load_origin_city,
        origin_state: row.load_origin_state,
        destination_city: row.load_destination_city,
        destination_state: row.load_destination_state,
        weight_kg: row.load_weight_kg,
        volume_m3: row.load_volume_m3,
        type: row.load_type,
        pickup_date: row.pickup_date,
        delivery_date: row.delivery_date,
        status: row.load_status,
      },
      driver: {
        id: row.driver_id,
        name: row.driver_name,
        phone: row.driver_phone,
        city: row.driver_city,
        state: row.driver_state,
        avg_rating: row.driver_avg_rating,
        total_reviews: row.driver_total_reviews,
      },
      company: {
        id: row.company_id,
        name: row.company_name,
        city: row.company_city,
        state: row.company_state,
        avg_rating: row.company_avg_rating,
        total_reviews: row.company_total_reviews,
      },
      route: {
        id: row.route_id,
        origin_city: row.route_origin_city,
        origin_state: row.route_origin_state,
        destination_city: row.route_destination_city,
        destination_state: row.route_destination_state,
        departure_date: row.departure_date,
        arrival_date: row.arrival_date,
      },
      vehicle: {
        model: row.vehicle_model,
        type: row.vehicle_type,
        plate: row.vehicle_plate,
      },
    }));
  });

  // ═══════════════════════════════════════════════════════
  //  GET /freights/stats — Estatísticas do histórico
  // ═══════════════════════════════════════════════════════
  app.get("/stats", async () => {
    const [statusCounts, totalRevenue, avgScore] = await Promise.all([
      query(`
        SELECT m.status, COUNT(*) as count
        FROM matches m
        GROUP BY m.status
      `),
      query(`
        SELECT COUNT(*) as total, ROUND(AVG(m.score)) as avg_score
        FROM matches m
        WHERE m.status IN ('completed', 'accepted')
      `),
    ]);

    const stats = {
      total: 0,
      completed: 0,
      in_progress: 0,
      cancelled: 0,
      pending: 0,
      avg_score: 0,
    };

    statusCounts.forEach((row) => {
      stats.total += row.count;
      if (row.status === "completed") stats.completed = row.count;
      else if (row.status === "accepted" || row.status === "pending") stats.in_progress += row.count;
      else if (row.status === "cancelled" || row.status === "rejected") stats.cancelled += row.count;
      else if (row.status === "pending") stats.pending = row.count;
    });

    if (totalRevenue.length > 0) {
      stats.avg_score = totalRevenue[0].avg_score || 0;
    }

    return stats;
  });
}
