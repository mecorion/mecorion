import type {FastifyInstance} from "fastify";
import {registerMediaRoutes} from "./media.routes.js";

export async function registerMediaModule(app: FastifyInstance) {
  await registerMediaRoutes(app);
}
