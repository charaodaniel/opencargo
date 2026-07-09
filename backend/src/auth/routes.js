import { z } from "zod";
import { AuthService } from "./service.js";
import { logAction } from "../logs/routes.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["empresa", "motorista", "company", "driver"]),
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
    const result = await authService.login(body);

    // Loga o login (não bloqueante)
    logAction({
      user: result.user,
      action: "login",
      entityType: "auth",
      entityId: result.user.id,
      ip: request.ip,
    }).catch(() => {});

    return reply.send(result);
  });

  app.get("/me", { onRequest: [app.authenticate] }, async (request) => {
    const user = request.user;
    const result = await authService.me(user.id);
    return result;
  });
}
