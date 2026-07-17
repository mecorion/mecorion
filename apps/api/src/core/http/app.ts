import cors from "@fastify/cors";
import Fastify from "fastify";
import {ZodError} from "zod";
import {config} from "../config/config.js";
import {registerMusicModule} from "../../modules/music/music.module.js";
import {registerHealthRoutes} from "./health.routes.js";

export async function createApp() {
  const app = Fastify({logger: {level: config.LOG_LEVEL}});

  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  await registerHealthRoutes(app);
  await registerMusicModule(app);

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
      message: "Внутренняя ошибка Mecorion API",
    });
  });

  return app;
}
