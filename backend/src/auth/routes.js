import { z } from "zod";
import { AuthService } from "./service.js";

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
    return reply.status(201).send(result);
  });

  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await authService.login(body);
    return reply.send(result);
  });

  app.get("/me", { onRequest: [app.authenticate] }, async (request) => {
    const user = request.user;
    const result = await authService.me(user.id);
    return result;
  });
}
