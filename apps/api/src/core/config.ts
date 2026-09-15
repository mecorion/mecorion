import "dotenv/config";
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
  CORS_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  JWT_MODE: z.enum(["secret", "keypair"]).default("secret"),
  JWT_SECRET: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  AUTH_CODE_TTL_SECONDS: z.coerce.number().int().min(60).default(600),
  AUTH_CODE_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
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

if (result.data.NODE_ENV !== "production" && result.data.JWT_MODE === "secret" && !result.data.JWT_SECRET) {
  result.data.JWT_SECRET = "dev-local-secret";
}

if (result.data.JWT_MODE === "secret" && !result.data.JWT_SECRET) {
  console.error("Для JWT_MODE=secret нужен JWT_SECRET.");
  process.exit(1);
}

if (result.data.JWT_MODE === "keypair" && (!result.data.JWT_PRIVATE_KEY || !result.data.JWT_PUBLIC_KEY)) {
  console.error("Для JWT_MODE=keypair нужны JWT_PRIVATE_KEY и JWT_PUBLIC_KEY.");
  process.exit(1);
}

export const config = result.data;
