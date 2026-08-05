import type {FastifyInstance} from "fastify";
import {registerAuthRoutes} from "./auth.routes.js";

export async function registerAuthModule(app: FastifyInstance) {
  await registerAuthRoutes(app);
}
