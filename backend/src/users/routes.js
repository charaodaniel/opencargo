import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";
import { config, isSupabaseAuth } from "../common/config.js";
import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  _supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabaseAdmin;
}

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().optional(),
});

const adminUpdateSchema = z.object({
  role: z.enum(["administrador", "gestor", "empresa", "motorista"]).optional(),
  active: z.coerce.number().min(0).max(1).optional(),
});

// Middleware: apenas administradores
async function adminOnly(request, reply) {
  if (request.user.role !== "administrador") {
    return reply.status(403).send({ error: "Acesso restrito a administradores" });
  }
}

export async function userRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  // ═══ Rotas Públicas (qualquer usuário logado) ═══════

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

  // ═══ Rotas de Admin (apenas administradores) ════════

  // Listar todos os usuários com detalhes para admin
  app.get("/admin/all", { preHandler: [adminOnly] }, async (request) => {
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(
        `SELECT id, name, email, role, phone, active, created_at, updated_at
         FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
      query(`SELECT COUNT(*) as total FROM users`),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  // Atualizar role ou status de um usuário
  app.patch("/:id/admin", { preHandler: [adminOnly] }, async (request) => {
    const { id } = request.params;
    const body = adminUpdateSchema.parse(request.body);

    // Impede auto-desativação
    if (id === request.user.id && body.active === 0) {
      throw { statusCode: 400, message: "Não é possível desativar a si mesmo" };
    }

    const sets = [];
    const params = [];

    if (body.role !== undefined) { sets.push("role = ?"); params.push(body.role); }
    if (body.active !== undefined) { sets.push("active = ?"); params.push(body.active); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);

    return await queryOne(`SELECT id, name, email, role, active FROM users WHERE id = ?`, [id]);
  });

  // Excluir usuário (também remove do Supabase Auth se configurado)
  app.delete("/:id/admin", { preHandler: [adminOnly] }, async (request, reply) => {
    const { id } = request.params;

    // Impede auto-exclusão
    if (id === request.user.id) {
      throw { statusCode: 400, message: "Não é possível excluir a si mesmo" };
    }

    // Verifica se o usuário existe
    const user = await queryOne(`SELECT id, email FROM users WHERE id = ?`, [id]);
    if (!user) {
      throw { statusCode: 404, message: "Usuário não encontrado" };
    }

    // Se estiver usando Supabase Auth, deleta também de lá
    if (isSupabaseAuth()) {
      try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error && error.status !== 404) {
          // Se o erro não for "not found" (já deletado do Supabase), propaga
          console.error("Erro ao deletar do Supabase:", error);
        }
      } catch (err) {
        console.error("Erro ao conectar com Supabase:", err);
        // Continua mesmo se Supabase falhar — o trigger on_auth_user_deleted
        // ou a FK CASCADE vão cuidar do public.users
      }
    }

    // Deleta do public.users (FK CASCADE cuida do resto)
    await query(`DELETE FROM users WHERE id = ?`, [id]);

    return reply.status(204).send();
  });
}

