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

  // Supabase Auth (opcional — usado apenas em produção com PostgreSQL)
  SUPABASE_URL: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  SUPABASE_ANON_KEY: z.string().default(""),
});

const parsed = envSchema.parse(process.env);

// ── Helper: está usando Supabase Auth? ────────────────
export const isSupabaseAuth = !!parsed.SUPABASE_URL;

// ── Validação de segurança ──────────────────────────────
const DEV_JWT_SECRET = "opencargo-dev-secret";

if (parsed.NODE_ENV === "production" && parsed.JWT_SECRET === DEV_JWT_SECRET) {
  const msg = [
    "╔══════════════════════════════════════════════════════════╗",
    "║  ⚠️  JWT_SECRET NÃO ALTERADO EM PRODUÇÃO!              ║",
    "╠══════════════════════════════════════════════════════════╣",
    "║  Por segurança, defina JWT_SECRET com um valor único.   ║",
    "║                                                         ║",
    "║  Gere um com:                                           ║",
    "║    node -e \"console.log(require('crypto')               ║",
    "║      .randomBytes(32).toString('hex'))\"                 ║",
    "╚══════════════════════════════════════════════════════════╝",
  ].join("\n");

  console.error(msg);
}

// ── Verificação de CORS_ORIGIN ─────────────────────────
if (parsed.NODE_ENV === "production") {
  const origins = parsed.CORS_ORIGIN.split(",").map((s) => s.trim());
  const hasLocalhost = origins.some((o) => o.includes("localhost"));
  if (hasLocalhost) {
    console.warn(
      "⚠️  CORS_ORIGIN contém localhost em produção. " +
      "Remova origens locais se não forem necessárias."
    );
  }
}

export const config = parsed;
