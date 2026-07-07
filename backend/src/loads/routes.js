import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";

const createLoadSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  originCity: z.string().min(2),
  originState: z.string().length(2),
  destinationCity: z.string().min(2),
  destinationState: z.string().length(2),
  weightKg: z.number().positive(),
  volumeM3: z.number().positive().optional(),
  type: z.string().optional(),
  status: z.enum(["pending", "available", "matched", "in_transit", "delivered", "cancelled"]).optional(),
  pickupDate: z.string(),
  deliveryDate: z.string(),
});

export async function loadRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const body = createLoadSchema.parse(request.body);
    const user = request.user;

    const company = queryOne(`SELECT id FROM companies WHERE user_id = ?`, [user.id]);

    if (!company) {
      throw { statusCode: 400, message: "Usuário não possui empresa cadastrada" };
    }

    const id = uuid();
    query(
      `INSERT INTO loads (id, company_id, title, description, origin_city, origin_state, destination_city, destination_state, weight_kg, volume_m3, type, pickup_date, delivery_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, company.id, body.title, body.description || null, body.originCity, body.originState, body.destinationCity, body.destinationState, body.weightKg, body.volumeM3 || null, body.type || null, body.pickupDate, body.deliveryDate]
    );

    const load = queryOne(`SELECT * FROM loads WHERE id = ?`, [id]);
    return reply.status(201).send(load);
  });

  app.get("/", async () => {
    return query(`SELECT * FROM loads`);
  });

  app.get("/available", async () => {
    return query(`SELECT * FROM loads WHERE status = 'available'`);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const load = queryOne(`SELECT * FROM loads WHERE id = ?`, [id]);

    if (!load) {
      throw { statusCode: 404, message: "Carga não encontrada" };
    }
    return load;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = createLoadSchema.partial().parse(request.body);

    const sets = [];
    const params = [];

    if (body.title) { sets.push("title = ?"); params.push(body.title); }
    if (body.description !== undefined) { sets.push("description = ?"); params.push(body.description); }
    if (body.originCity) { sets.push("origin_city = ?"); params.push(body.originCity); }
    if (body.originState) { sets.push("origin_state = ?"); params.push(body.originState); }
    if (body.destinationCity) { sets.push("destination_city = ?"); params.push(body.destinationCity); }
    if (body.destinationState) { sets.push("destination_state = ?"); params.push(body.destinationState); }
    if (body.weightKg) { sets.push("weight_kg = ?"); params.push(body.weightKg); }
    if (body.volumeM3 !== undefined) { sets.push("volume_m3 = ?"); params.push(body.volumeM3); }
    if (body.type !== undefined) { sets.push("type = ?"); params.push(body.type); }
    if (body.status) { sets.push("status = ?"); params.push(body.status); }
    if (body.pickupDate) { sets.push("pickup_date = ?"); params.push(body.pickupDate); }
    if (body.deliveryDate) { sets.push("delivery_date = ?"); params.push(body.deliveryDate); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    sets.push("updated_at = datetime('now')");
    params.push(id);

    query(`UPDATE loads SET ${sets.join(", ")} WHERE id = ?`, params);

    return queryOne(`SELECT * FROM loads WHERE id = ?`, [id]);
  });
}
