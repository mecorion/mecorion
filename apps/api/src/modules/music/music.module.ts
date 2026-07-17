import type {FastifyInstance} from "fastify";
import {registerCatalogRoutes} from "./music-catalog.routes.js";
import {registerTrackRoutes} from "./music-tracks.routes.js";

export async function registerMusicModule(app: FastifyInstance) {
  await registerTrackRoutes(app);
  await registerCatalogRoutes(app);
}
