import type {FastifyInstance} from "fastify";
import {registerMusicAdminRoutes} from "./music-admin.routes.js";
import {registerCatalogRoutes} from "./music-catalog.routes.js";
import {registerTrackRoutes} from "./music-tracks.routes.js";

export async function registerMusicModule(app: FastifyInstance) {
  await registerMusicAdminRoutes(app);
  await registerTrackRoutes(app);
  await registerCatalogRoutes(app);
}
