import type {FastifyInstance} from "fastify";
import {registerVideoRoutes} from "./video.routes.js";

export async function registerVideoModule(app: FastifyInstance) {
  await registerVideoRoutes(app);
}
