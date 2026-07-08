import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().optional(),
});

export async function userRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.get("/", async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT id, name, email, role, active FROM users ORDER BY name ASC LIMIT ? OFFSET ?`, [limit, offset]),
      query(`SELECT COUNT(*) as total FROM users`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const user = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);

    if (!user) {
      throw { statusCode: 404, message: "Usuário não encontrado" };
    }
    return user;
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = updateUserSchema.parse(request.body);

    const sets = [];
    const params = [];

    if (body.name) { sets.push("name = ?"); params.push(body.name); }
    if (body.phone) { sets.push("phone = ?"); params.push(body.phone); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT id, name, email, role FROM users WHERE id = ?`, [id]);
  });
}
