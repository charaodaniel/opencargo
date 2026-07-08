import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";

const createVehicleSchema = z.object({
  plate: z.string().min(7).max(8),
  model: z.string().min(2),
  year: z.number().int().optional(),
  capacityKg: z.number().positive(),
  capacityM3: z.number().positive(),
  type: z.string().optional(),
});

export async function vehicleRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const body = createVehicleSchema.parse(request.body);
    const user = request.user;

    // Busca o motorista associado ao usuário logado
    const driver = await queryOne(`SELECT id FROM drivers WHERE user_id = ?`, [user.id]);

    if (!driver) {
      throw { statusCode: 400, message: "Usuário não possui motorista cadastrado" };
    }

    const id = uuid();
    await query(
      `INSERT INTO vehicles (id, driver_id, plate, model, year, capacity_kg, capacity_m3, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, driver.id, body.plate, body.model, body.year || null, body.capacityKg, body.capacityM3, body.type || null]
    );

    const vehicle = await queryOne(`SELECT * FROM vehicles WHERE id = ?`, [id]);
    return reply.status(201).send(vehicle);
  });

  app.get("/", async () => {
    return await query(`SELECT * FROM vehicles`);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const vehicle = await queryOne(`SELECT * FROM vehicles WHERE id = ?`, [id]);

    if (!vehicle) {
      throw { statusCode: 404, message: "Veículo não encontrado" };
    }
    return vehicle;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = createVehicleSchema.partial().parse(request.body);

    const sets = [];
    const params = [];

    if (body.plate) { sets.push("plate = ?"); params.push(body.plate); }
    if (body.model) { sets.push("model = ?"); params.push(body.model); }
    if (body.year !== undefined) { sets.push("year = ?"); params.push(body.year); }
    if (body.capacityKg) { sets.push("capacity_kg = ?"); params.push(body.capacityKg); }
    if (body.capacityM3) { sets.push("capacity_m3 = ?"); params.push(body.capacityM3); }
    if (body.type !== undefined) { sets.push("type = ?"); params.push(body.type); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    params.push(id);
    await query(`UPDATE vehicles SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT * FROM vehicles WHERE id = ?`, [id]);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;
    await query(`DELETE FROM vehicles WHERE id = ?`, [id]);
    return reply.status(204).send();
  });
}
