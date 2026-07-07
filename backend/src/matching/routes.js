import { query, queryOne, uuid } from "../common/database.js";

export async function matchingRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * Encontra cargas compatíveis com a rota de um motorista
   * Algoritmo MVP: matching por cidades
   */
  app.get("/loads-for-driver/:driverId", async (request) => {
    const { driverId } = request.params;

    // Busca rotas ativas do motorista
    const driverRoutes = query(
      `SELECT * FROM routes WHERE driver_id = ? AND status = 'active'`,
      [driverId]
    );

    const matchesResult = [];

    for (const route of driverRoutes) {
      // Busca cargas que correspondam à rota
      const compatibleLoads = query(
        `SELECT * FROM loads
         WHERE origin_city = ? AND destination_city = ?
         AND status = 'available'
         AND weight_kg <= ?
         AND pickup_date <= ?`,
        [route.destination_city, route.origin_city, route.available_weight || 99999, route.departure_date]
      );

      for (const load of compatibleLoads) {
        matchesResult.push({
          route,
          load,
          score: 100, // MVP: match exato = score máximo
        });
      }
    }

    return matchesResult;
  });

  /**
   * Encontra motoristas compatíveis com uma carga
   */
  app.get("/drivers-for-load/:loadId", async (request) => {
    const { loadId } = request.params;

    const load = queryOne(`SELECT * FROM loads WHERE id = ?`, [loadId]);

    if (!load) {
      throw { statusCode: 404, message: "Carga não encontrada" };
    }

    // Busca motoristas com rotas que atendam a carga
    const compatibleRoutes = query(
      `SELECT * FROM routes
       WHERE origin_city = ? AND destination_city = ?
       AND is_return = 1 AND status = 'active'
       AND available_weight >= ?`,
      [load.destination_city, load.origin_city, load.weight_kg]
    );

    const result = [];
    for (const route of compatibleRoutes) {
      const driver = queryOne(`SELECT * FROM drivers WHERE id = ?`, [route.driver_id]);
      const vehicle = queryOne(`SELECT * FROM vehicles WHERE driver_id = ?`, [route.driver_id]);

      result.push({
        route,
        driver,
        vehicle,
        score: 100,
      });
    }

    return result;
  });

  /**
   * Criar um match (empresa aceita motorista ou motorista aceita carga)
   */
  app.post("/", async (request, reply) => {
    const { loadId, driverId, routeId } = request.body;

    const id = uuid();
    query(
      `INSERT INTO matches (id, load_id, driver_id, route_id, score, status)
       VALUES (?, ?, ?, ?, 100, 'pending')`,
      [id, loadId, driverId, routeId]
    );

    // Atualiza status da carga
    query(`UPDATE loads SET status = 'matched' WHERE id = ?`, [loadId]);

    const match = queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
    return reply.status(201).send(match);
  });

  /**
   * Listar matches
   */
  app.get("/", async () => {
    return query(`SELECT * FROM matches`);
  });

  /**
   * Atualizar status do match
   */
  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const { status } = request.body;

    query(`UPDATE matches SET status = ? WHERE id = ?`, [status, id]);

    return queryOne(`SELECT * FROM matches WHERE id = ?`, [id]);
  });
}
