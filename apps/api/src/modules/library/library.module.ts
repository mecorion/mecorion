import type {FastifyInstance} from "fastify";
import {registerLibraryRoutes} from "./library.routes.js";

export async function registerLibraryModule(app: FastifyInstance) {
  await registerLibraryRoutes(app);
}
