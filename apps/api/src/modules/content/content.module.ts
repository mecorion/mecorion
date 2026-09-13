import type {FastifyInstance} from "fastify";
import {registerContentRoutes} from "./content.routes.js";

export async function registerContentModule(app: FastifyInstance) {
  await registerContentRoutes(app);
}
