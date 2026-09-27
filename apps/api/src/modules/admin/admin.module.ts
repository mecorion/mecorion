import type {FastifyInstance} from "fastify";
import {registerAdminAccessRoutes} from "./admin.access.routes.js";
import {registerAdminAccountRoutes} from "./admin.accounts.routes.js";

export async function registerAdminModule(app: FastifyInstance) {
  await registerAdminAccountRoutes(app);
  await registerAdminAccessRoutes(app);
}
