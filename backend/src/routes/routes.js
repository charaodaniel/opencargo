import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

const createRouteSchema = z.object({
  originCity: z.string().min(2),
  originState: z.string().length(2),
  destinationCity: z.string().min(2),
  destinationState: z.string().length(2),
  departureDate: z.string(),
  arrivalDate: z.string(),
  availableWeight: z.number().positive().optional(),
  availableVolume: z.number().positive().optional(),
  isReturn: z.boolean().default(false),
});

export async function routeRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const body = createRouteSchema.parse(request.body);
    const user = request.user;

    const driver = await queryOne(`SELECT id FROM drivers WHERE user_id = ?`, [user.id]);

    if (!driver) {
      throw { statusCode: 400, message: "Usuário não possui motorista cadastrado" };
    }

    const id = uuid();
    await query(
      `INSERT INTO routes (id, driver_id, origin_city, origin_state, destination_city, destination_state, departure_date, arrival_date, available_weight, available_volume, is_return)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, driver.id, body.originCity, body.originState, body.destinationCity, body.destinationState, body.departureDate, body.arrivalDate, body.availableWeight || null, body.availableVolume || null, body.isReturn ? 1 : 0]
    );

    const route = await queryOne(`SELECT * FROM routes WHERE id = ?`, [id]);
    return reply.status(201).send(route);
  });

  app.get("/", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM routes ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM routes`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/active", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM routes WHERE status = 'active' ORDER BY departure_date ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM routes WHERE status = 'active'`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/return", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM routes WHERE is_return = 1 ORDER BY departure_date ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM routes WHERE is_return = 1`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const route = await queryOne(`SELECT * FROM routes WHERE id = ?`, [id]);

    if (!route) {
      throw { statusCode: 404, message: "Rota não encontrada" };
    }
    return route;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = createRouteSchema.partial().parse(request.body);

    const sets = [];
    const params = [];

    if (body.originCity) { sets.push("origin_city = ?"); params.push(body.originCity); }
    if (body.originState) { sets.push("origin_state = ?"); params.push(body.originState); }
    if (body.destinationCity) { sets.push("destination_city = ?"); params.push(body.destinationCity); }
    if (body.destinationState) { sets.push("destination_state = ?"); params.push(body.destinationState); }
    if (body.departureDate) { sets.push("departure_date = ?"); params.push(body.departureDate); }
    if (body.arrivalDate) { sets.push("arrival_date = ?"); params.push(body.arrivalDate); }
    if (body.availableWeight !== undefined) { sets.push("available_weight = ?"); params.push(body.availableWeight); }
    if (body.availableVolume !== undefined) { sets.push("available_volume = ?"); params.push(body.availableVolume); }
    if (body.isReturn !== undefined) { sets.push("is_return = ?"); params.push(body.isReturn ? 1 : 0); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    params.push(id);
    await query(`UPDATE routes SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT * FROM routes WHERE id = ?`, [id]);
  });

  /**
   * Excluir rota
   */
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;

    const route = await queryOne(`SELECT id FROM routes WHERE id = ?`, [id]);
    if (!route) {
      return reply.status(404).send({ error: "Rota não encontrada" });
    }

    await query(`DELETE FROM routes WHERE id = ?`, [id]);
    return reply.status(204).send();
  });
}
