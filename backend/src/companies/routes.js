import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";

const createCompanySchema = z.object({
  name: z.string().min(3),
  document: z.string().min(11),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
});

export async function companyRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const body = createCompanySchema.parse(request.body);
    const user = request.user;
    const id = uuid();

    query(
      `INSERT INTO companies (id, user_id, name, document, address, city, state, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, body.name, body.document, body.address || null, body.city || null, body.state || null, body.phone || null]
    );

    const company = queryOne(`SELECT * FROM companies WHERE id = ?`, [id]);
    return reply.status(201).send(company);
  });

  app.get("/", async () => {
    return query(`SELECT * FROM companies`);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const company = queryOne(`SELECT * FROM companies WHERE id = ?`, [id]);

    if (!company) {
      throw { statusCode: 404, message: "Empresa não encontrada" };
    }
    return company;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = createCompanySchema.partial().parse(request.body);

    const sets = [];
    const params = [];

    if (body.name) { sets.push("name = ?"); params.push(body.name); }
    if (body.document) { sets.push("document = ?"); params.push(body.document); }
    if (body.address !== undefined) { sets.push("address = ?"); params.push(body.address); }
    if (body.city !== undefined) { sets.push("city = ?"); params.push(body.city); }
    if (body.state !== undefined) { sets.push("state = ?"); params.push(body.state); }
    if (body.phone !== undefined) { sets.push("phone = ?"); params.push(body.phone); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    params.push(id);
    query(`UPDATE companies SET ${sets.join(", ")} WHERE id = ?`, params);

    return queryOne(`SELECT * FROM companies WHERE id = ?`, [id]);
  });
}
