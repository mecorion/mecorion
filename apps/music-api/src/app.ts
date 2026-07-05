import cors from "@fastify/cors";
import Fastify from "fastify";
import {ZodError} from "zod";
import {config} from "./config.js";
import {registerCatalogRoutes} from "./routes/catalog.js";
import {registerHealthRoutes} from "./routes/health.js";
import {registerTrackRoutes} from "./routes/tracks.js";

export async function createApp() {
  const app = Fastify({logger: {level: config.LOG_LEVEL}});

  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  await registerHealthRoutes(app);
  await registerTrackRoutes(app);
  await registerCatalogRoutes(app);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Проверьте переданные параметры",
        details: error.flatten(),
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "Внутренняя ошибка Music API",
    });
  });

  return app;
}

