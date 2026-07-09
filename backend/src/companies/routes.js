import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

/**
 * Valida CNPJ (dígitos verificadores)
 */
function isValidCnpj(cnpj) {
  const nums = cnpj.replace(/\D/g, "");
  if (nums.length !== 14 || /^(\d)\1{13}$/.test(nums)) return false;
  const calc = (digits, factors) =>
    digits.reduce((sum, d, i) => sum + d * factors[i], 0) % 11;
  const d1 = calc(nums.slice(0, 12).split("").map(Number), [5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2 = calc(nums.slice(0, 13).split("").map(Number), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return parseInt(nums[12]) === (d1 < 2 ? 0 : 11 - d1) &&
         parseInt(nums[13]) === (d2 < 2 ? 0 : 11 - d2);
}

const createCompanySchema = z.object({
  name: z.string().min(3),
  document: z.string().min(14).max(18).refine(isValidCnpj, "CNPJ inválido"),
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

    await query(
      `INSERT INTO companies (id, user_id, name, document, address, city, state, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, body.name, body.document, body.address || null, body.city || null, body.state || null, body.phone || null]
    );

    const company = await queryOne(`SELECT * FROM companies WHERE id = ?`, [id]);
    return reply.status(201).send(company);
  });

  app.get("/", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM companies ORDER BY name ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM companies`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/me", async (request) => {
    const user = request.user;
    const company = await queryOne(`SELECT * FROM companies WHERE user_id = ?`, [user.id]);
    if (!company) {
      throw { statusCode: 404, message: "Empresa não encontrada" };
    }
    return company;
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const company = await queryOne(`SELECT * FROM companies WHERE id = ?`, [id]);

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
    await query(`UPDATE companies SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT * FROM companies WHERE id = ?`, [id]);
  });
}
