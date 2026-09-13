import type {FastifyInstance} from "fastify";
import {registerAdminAccountRoutes} from "./admin.accounts.routes.js";

export async function registerAdminModule(app: FastifyInstance) {
  await registerAdminAccountRoutes(app);
}
