import type {FastifyInstance} from "fastify";
import {registerPlatformRoutes} from "./platform.routes.js";

export async function registerPlatformModule(app: FastifyInstance) {
  await registerPlatformRoutes(app);
}
