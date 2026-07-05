import type {FastifyInstance} from "fastify";
import {query} from "../database.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    try {
      await query("SELECT 1");
      return {status: "ok", database: "connected", service: "mecorion-music-api"};
    } catch (error) {
      app.log.error(error);
      return reply.status(503).send({
        status: "degraded",
        database: "unavailable",
        service: "mecorion-music-api",
      });
    }
  });
}

