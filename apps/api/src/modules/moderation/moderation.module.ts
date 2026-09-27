import type {FastifyInstance} from "fastify";
import {registerModerationRoutes} from "./moderation.routes.js";

export async function registerModerationModule(app: FastifyInstance) {
  await registerModerationRoutes(app);
}
