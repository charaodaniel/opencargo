import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().optional(),
});

export async function userRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.get("/", async () => {
    return query(`SELECT id, name, email, role, active FROM users`);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params;
    const user = queryOne(`SELECT * FROM users WHERE id = ?`, [id]);

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

    sets.push("updated_at = datetime('now')");
    params.push(id);

    query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);

    return queryOne(`SELECT id, name, email, role FROM users WHERE id = ?`, [id]);
  });
}
