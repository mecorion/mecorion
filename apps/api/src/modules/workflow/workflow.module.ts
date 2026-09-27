import type {FastifyInstance} from "fastify";
import {registerWorkflowRoutes} from "./workflow.routes.js";

export async function registerWorkflowModule(app: FastifyInstance) {
  await registerWorkflowRoutes(app);
}
