import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";

import { config, isSupabaseAuth } from "./common/config.js";
import { AuthService } from "./auth/service.js";

import { authRoutes } from "./auth/routes.js";
import { userRoutes } from "./users/routes.js";
import { companyRoutes } from "./companies/routes.js";
import { driverRoutes } from "./drivers/routes.js";
import { vehicleRoutes } from "./vehicles/routes.js";
import { routeRoutes } from "./routes/routes.js";
import { loadRoutes } from "./loads/routes.js";
import { matchingRoutes } from "./matching/routes.js";
import { mapRoutes } from "./maps/routes.js";
import { notificationRoutes } from "./notifications/routes.js";
import { documentRoutes } from "./documents/routes.js";
import { reviewRoutes } from "./reviews/routes.js";
import { freightRoutes } from "./freights/routes.js";
import { chatRoutes } from "./chat/routes.js";
import { logRoutes, logAction } from "./logs/routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // ── Plugins ────────────────────────────────────────────────
  // CORS: aceita uma ou mais origens separadas por vírgula
  const corsOrigins = config.CORS_ORIGIN.split(",").map((s) => s.trim());
  await app.register(cors, {
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
  });

  await app.register(websocket);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "OpenCargo API",
        description: "API para logística colaborativa e frete de retorno",
        version: "0.1.0",
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // ── Cria instância do AuthService ─────────────────────────
  const authService = new AuthService(app);

  // ── Autenticação decorator ─────────────────────────────────
  app.decorate("authenticate", async function (request, reply) {
    try {
      if (isSupabaseAuth()) {
        // Modo Supabase Auth: verifica o JWT via API do Supabase
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new Error("Token não fornecido");
        }
        const token = authHeader.replace("Bearer ", "");
        request.user = await authService.verifyToken(token);
      } else {
        // Modo local: verifica o JWT próprio do Fastify
        await request.jwtVerify();
      }
    } catch (err) {
      reply.status(401).send({ error: "Não autorizado" });
    }
  });

  // Expõe authService para as rotas (algumas rotas usam app.authService)
  app.decorate("authService", authService);

  // ── Middleware de Log para ações de escrita ────────────────
  app.addHook("onResponse", async (request, reply) => {
    if (!request.user) return;
    const method = request.method;
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(method)) return;
    if (request.url.includes("/api/auth/login") || request.url.includes("/api/auth/register")) return;
    if (request.url.includes("/api/chat/ws") || request.url.includes("/api/notifications/ws")) return;

    const url = request.url.replace("/api/", "");
    const entityType = url.split("/")[0];
    const entityId = url.split("/")[1] || null;

    const actionMap = {
      POST: "create",
      PUT: "update",
      PATCH: "update",
      DELETE: "delete",
    };

    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      await logAction({
        user: request.user,
        action: actionMap[method] || method.toLowerCase(),
        entityType,
        entityId,
        details: request.body ? { body: request.body } : null,
        ip: request.ip,
      });
    }
  });

  // ── Rotas ──────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(companyRoutes, { prefix: "/api/companies" });
  await app.register(driverRoutes, { prefix: "/api/drivers" });
  await app.register(vehicleRoutes, { prefix: "/api/vehicles" });
  await app.register(routeRoutes, { prefix: "/api/routes" });
  await app.register(loadRoutes, { prefix: "/api/loads" });
  await app.register(matchingRoutes, { prefix: "/api/matching" });
  await app.register(mapRoutes, { prefix: "/api/maps" });
  await app.register(notificationRoutes, { prefix: "/api/notifications" });
  await app.register(documentRoutes, { prefix: "/api/documents" });
  await app.register(reviewRoutes, { prefix: "/api/reviews" });
  await app.register(freightRoutes, { prefix: "/api/freights" });
  await app.register(chatRoutes, { prefix: "/api/chat" });
  await app.register(logRoutes, { prefix: "/api/logs" });

  // ── Health Check ───────────────────────────────────────────
  app.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return app;
}
