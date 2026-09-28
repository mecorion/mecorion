import {config} from "./core/config.js";
import {database} from "./core/database.js";
import {createApp} from "./core/http/app.js";

const app = await createApp();

if (config.AUTH_MODE === "dev-bypass") {
  app.log.warn(
    {devAccount: config.DEV_AUTH_ACCOUNT},
    "DEV AUTH BYPASS включён: JWT не проверяется, используется локальный seeded-аккаунт",
  );
}

async function shutdown(signal: string) {
  app.log.info({signal}, "Mecorion API завершает работу");
  await app.close();
  await database.end();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({host: config.HOST, port: config.PORT});
} catch (error) {
  app.log.error(error);
  await database.end();
  process.exit(1);
}
