import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";

const createDriverSchema = z.object({
  name: z.string().min(3),
  document: z.string().min(11),
  cnh: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export async function driverRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const body = createDriverSchema.parse(request.body);
    const user = request.user;
    const id = uuid();

    await query(
      `INSERT INTO drivers (id, user_id, name, document, cnh, phone, city, state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, body.name, body.document, body.cnh || null, body.phone || null, body.city || null, body.state || null]
    );

    const driver = await queryOne(`SELECT * FROM drivers WHERE id = ?`, [id]);
    return reply.status(201).send(driver);
  });

  app.get("/", async () => {
    return await query(`SELECT * FROM drivers`);
  });

  app.get("/me", async (request) => {
    const user = request.user;
    const driver = await queryOne(`SELECT * FROM drivers WHERE user_id = ?`, [user.id]);
    if (!driver) {
      throw { statusCode: 404, message: "Motorista não encontrado" };
    }
    return driver;
  });

  app.get("/available", async () => {
    return await query(`SELECT * FROM drivers WHERE available = 1`);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const driver = await queryOne(`SELECT * FROM drivers WHERE id = ?`, [id]);

    if (!driver) {
      throw { statusCode: 404, message: "Motorista não encontrado" };
    }
    return driver;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = createDriverSchema.partial().parse(request.body);

    const sets = [];
    const params = [];

    if (body.name) { sets.push("name = ?"); params.push(body.name); }
    if (body.document) { sets.push("document = ?"); params.push(body.document); }
    if (body.cnh !== undefined) { sets.push("cnh = ?"); params.push(body.cnh); }
    if (body.phone !== undefined) { sets.push("phone = ?"); params.push(body.phone); }
    if (body.city !== undefined) { sets.push("city = ?"); params.push(body.city); }
    if (body.state !== undefined) { sets.push("state = ?"); params.push(body.state); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    params.push(id);
    await query(`UPDATE drivers SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT * FROM drivers WHERE id = ?`, [id]);
  });
}
