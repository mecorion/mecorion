import "dotenv/config";
import {readFileSync} from "node:fs";
import {z} from "zod";

const envBoolean = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (["true", "1", "yes", "on"].includes(value.toLowerCase())) return true;
  if (["false", "0", "no", "off"].includes(value.toLowerCase())) return false;
  return value;
}, z.boolean());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  MEDIA_STORAGE_ROOT: z.string().min(1).default("../../data"),
  MEDIA_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(536_870_912),
  // Several first-party frontends use the same API in development. Values are
  // comma-separated so production can still provide a single explicit origin.
  CORS_ORIGIN: z.string().default(
    "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174",
  ),
  AUTH_MODE: z.enum(["required", "dev-bypass"]).default("required"),
  DEV_AUTH_ACCOUNT: z.string().trim().min(3).max(32).default("dev-admin"),
  JWT_MODE: z.enum(["secret", "keypair"]).default("secret"),
  JWT_SECRET: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY_PATH: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  AUTH_CODE_TTL_SECONDS: z.coerce.number().int().min(60).default(600),
  AUTH_CODE_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  AUTH_SEED_PEPPER: z.string().min(16).optional(),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  ADMIN_BOOTSTRAP_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: envBoolean.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default("noreply@mecorion.local"),
  MAIL_DEV_MODE: envBoolean.default(true),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Некорректная конфигурация Mecorion API", result.error.flatten().fieldErrors);
  process.exit(1);
}

if (result.data.NODE_ENV === "production" && result.data.JWT_MODE === "secret") {
  console.error("JWT_MODE=secret запрещён в production. Используйте JWT_MODE=keypair.");
  process.exit(1);
}

function isLoopbackHost(host: string) {
  return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(host.toLowerCase());
}

if (result.data.AUTH_MODE === "dev-bypass") {
  let databaseHost = "";
  try {
    databaseHost = new URL(result.data.DATABASE_URL).hostname;
  } catch {
    console.error("DATABASE_URL должен быть корректным URL.");
    process.exit(1);
  }

  if (result.data.NODE_ENV !== "development") {
    console.error("AUTH_MODE=dev-bypass разрешён только при NODE_ENV=development.");
    process.exit(1);
  }
  if (!isLoopbackHost(result.data.HOST) || !isLoopbackHost(databaseHost)) {
    console.error("AUTH_MODE=dev-bypass разрешён только для локального API и локальной PostgreSQL.");
    process.exit(1);
  }
}

if (result.data.NODE_ENV !== "production" && result.data.JWT_MODE === "secret" && !result.data.JWT_SECRET) {
  result.data.JWT_SECRET = "dev-local-secret";
}

if (result.data.NODE_ENV !== "production" && !result.data.AUTH_SEED_PEPPER) {
  result.data.AUTH_SEED_PEPPER = "mecorion-dev-seed-pepper";
}

if (result.data.JWT_MODE === "keypair") {
  if (!result.data.JWT_PRIVATE_KEY && result.data.JWT_PRIVATE_KEY_PATH) {
    result.data.JWT_PRIVATE_KEY = readFileSync(result.data.JWT_PRIVATE_KEY_PATH, "utf8");
  }
  if (!result.data.JWT_PUBLIC_KEY && result.data.JWT_PUBLIC_KEY_PATH) {
    result.data.JWT_PUBLIC_KEY = readFileSync(result.data.JWT_PUBLIC_KEY_PATH, "utf8");
  }
}

if (result.data.JWT_MODE === "secret" && !result.data.JWT_SECRET) {
  console.error("Для JWT_MODE=secret нужен JWT_SECRET.");
  process.exit(1);
}

if (result.data.JWT_MODE === "keypair" && (!result.data.JWT_PRIVATE_KEY || !result.data.JWT_PUBLIC_KEY)) {
  console.error("Для JWT_MODE=keypair нужны JWT_PRIVATE_KEY и JWT_PUBLIC_KEY.");
  process.exit(1);
}

if (!result.data.AUTH_SEED_PEPPER) {
  console.error("Для проверки отдельных слов seed phrase нужен AUTH_SEED_PEPPER.");
  process.exit(1);
}

export const config = result.data as typeof result.data & {AUTH_SEED_PEPPER: string};
