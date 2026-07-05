import "dotenv/config";
import {z} from "zod";

const EnvironmentSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
});

const result = EnvironmentSchema.safeParse(process.env);

if (!result.success) {
  console.error("Некорректная конфигурация Music API", result.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = result.data;

