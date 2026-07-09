import { z } from "zod";
import { AuthService } from "./service.js";
import { logAction } from "../logs/routes.js";
import { queryOne, query } from "../common/database.js";
import { config } from "../common/config.js";

/**
 * Valida se a senha atende aos requisitos mínimos:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
function isValidPassword(password) {
  return /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) && password.length >= 8;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").refine(isValidPassword, {
    message: "A senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial",
  }),
  role: z.enum(["empresa", "motorista", "company", "driver"]),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").refine(isValidPassword, {
    message: "A senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial",
  }),
});

export async function authRoutes(app) {
  const authService = new AuthService(app);

  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body);

    // Loga o registro (não bloqueante)
    logAction({
      user: result.user,
      action: "create",
      entityType: "users",
      entityId: result.user.id,
      ip: request.ip,
    }).catch(() => {});

    return reply.status(201).send(result);
  });

  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    let result;
    try {
      result = await authService.login(body);
    } catch (err) {
      // Loga tentativa de login falha (não bloqueante)
      logAction({
        user: null,
        action: "login_failed",
        entityType: "auth",
        details: { email: body.email },
        ip: request.ip,
      }).catch(() => {});

      return reply.status(err.statusCode || 401).send({ error: err.message || "Credenciais inválidas" });
    }

    // Verifica se a senha do usuário atende aos requisitos atuais
    // Se não atender, sinaliza para o frontend pedir redefinição
    const user = result.user;
    const needsPasswordReset = !isValidPassword(body.password);

    // Loga o login bem-sucedido (não bloqueante)
    logAction({
      user,
      action: "login",
      entityType: "auth",
      entityId: user.id,
      ip: request.ip,
    }).catch(() => {});

    return reply.send({ ...result, needsPasswordReset });
  });

  /**
   * Atualiza a senha do usuário autenticado
   */
  app.patch("/password", { onRequest: [app.authenticate] }, async (request, reply) => {
    const body = updatePasswordSchema.parse(request.body);
    const user = request.user;

    // Verifica senha atual
    const dbUser = await queryOne(`SELECT password FROM users WHERE id = ?`, [user.id]);
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(body.currentPassword, dbUser.password);
    if (!valid) {
      return reply.status(401).send({ error: "Senha atual incorreta" });
    }

    // Atualiza para a nova senha
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    await query(`UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?`, [hashedPassword, user.id]);

    // Gera novo token
    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    logAction({
      user,
      action: "update",
      entityType: "users",
      entityId: user.id,
      details: { field: "password" },
      ip: request.ip,
    }).catch(() => {});

    return { success: true, token };
  });

  app.get("/me", { onRequest: [app.authenticate] }, async (request) => {
    const user = request.user;
    const result = await authService.me(user.id);
    return result;
  });
}
