import {createApp} from "./app.js";
import {config} from "./config.js";
import {database} from "./database.js";

const app = await createApp();

async function shutdown(signal: string) {
  app.log.info({signal}, "Music API завершает работу");
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

