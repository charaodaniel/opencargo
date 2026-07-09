import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

/**
 * Valida CPF (dígitos verificadores)
 */
function isValidCpf(cpf) {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  const calc = (digits, factors) =>
    digits.reduce((sum, d, i) => sum + d * factors[i], 0) % 11;
  const d1 = calc(nums.slice(0, 9).split("").map(Number), [10,9,8,7,6,5,4,3,2]);
  const d2 = calc(nums.slice(0, 10).split("").map(Number), [11,10,9,8,7,6,5,4,3,2]);
  return parseInt(nums[9]) === (d1 < 2 ? 0 : 11 - d1) &&
         parseInt(nums[10]) === (d2 < 2 ? 0 : 11 - d2);
}

const createDriverSchema = z.object({
  name: z.string().min(3),
  document: z.string().min(11).max(14).refine(isValidCpf, "CPF inválido"),
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

  app.get("/", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM drivers ORDER BY name ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM drivers`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/me", async (request) => {
    const user = request.user;
    const driver = await queryOne(`SELECT * FROM drivers WHERE user_id = ?`, [user.id]);
    if (!driver) {
      throw { statusCode: 404, message: "Motorista não encontrado" };
    }
    return driver;
  });

  app.get("/available", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM drivers WHERE available = 1 ORDER BY name ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM drivers WHERE available = 1`),
    ]);

    return paginatedResponse(rows, total, page, limit);
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
