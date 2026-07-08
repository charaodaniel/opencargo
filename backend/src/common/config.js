import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().default("opencargo-dev-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DATABASE_URL: z.string().default("file:./data/opencargo.db"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
});

export const config = envSchema.parse(process.env);
