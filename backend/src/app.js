import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";

import { config } from "./common/config.js";
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
import { chatRoutes } from "./chat/routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // ── Plugins ────────────────────────────────────────────────
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
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

  // ── Autenticação decorator ─────────────────────────────────
  app.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Não autorizado" });
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
  await app.register(chatRoutes, { prefix: "/api/chat" });

  // ── Health Check ───────────────────────────────────────────
  app.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return app;
}
