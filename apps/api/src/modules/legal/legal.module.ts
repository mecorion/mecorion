import type {FastifyInstance} from "fastify";
import {registerLegalRoutes} from "./legal.routes.js";

export async function registerLegalModule(app: FastifyInstance) {
  await registerLegalRoutes(app);
}
