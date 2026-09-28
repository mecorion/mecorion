import cors from "@fastify/cors";
import Fastify from "fastify";
import {ZodError} from "zod";
import {config} from "../config.js";
import {ApiError} from "./api-error.js";
import {requireAdminPanelAccess} from "./auth-context.js";
import {registerAdminModule} from "../../modules/admin/admin.module.js";
import {registerAuditModule} from "../../modules/audit/audit.module.js";
import {registerAuthModule} from "../../modules/auth/auth.module.js";
import {registerContentModule} from "../../modules/content/content.module.js";
import {registerLegalModule} from "../../modules/legal/legal.module.js";
import {registerLibraryModule} from "../../modules/library/library.module.js";
import {registerMediaModule} from "../../modules/media/media.module.js";
import {registerModerationModule} from "../../modules/moderation/moderation.module.js";
import {registerMusicModule} from "../../modules/music/music.module.js";
import {registerPlatformModule} from "../../modules/platform/platform.module.js";
import {registerVideoModule} from "../../modules/video/video.module.js";
import {registerWorkflowModule} from "../../modules/workflow/workflow.module.js";
import {registerHealthRoutes} from "./health.routes.js";

export async function createApp() {
  const app = Fastify({logger: {level: config.LOG_LEVEL}});

  const allowedOrigins = config.CORS_ORIGIN
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Credentials and seed phrases must never be cached by a browser, proxy or
  // CDN. These headers are scoped to auth endpoints and do not affect media.
  app.addHook("onSend", async (request, reply, payload) => {
    if (request.url.startsWith("/api/v1/auth") || request.url.startsWith("/api/v1/account/seed")) {
      reply.header("Cache-Control", "no-store, max-age=0");
      reply.header("Pragma", "no-cache");
      reply.header("Referrer-Policy", "no-referrer");
      reply.header("X-Content-Type-Options", "nosniff");
    }
    return payload;
  });

  // This gate is intentionally stricter than individual domain permissions:
  // every admin endpoint requires both the ADMIN role and platform.admin.
  app.addHook("preHandler", async (request) => {
    if (request.method === "OPTIONS" || !request.url.startsWith("/api/v1/admin")) return;

    // The one-time bootstrap path is not used by the web panel. It remains
    // available only for creating the first administrator with a server secret.
    const isAccountBootstrap = request.method === "POST"
      && request.url === "/api/v1/admin/accounts"
      && config.ADMIN_BOOTSTRAP_TOKEN
      && request.headers["x-mecorion-bootstrap-token"] === config.ADMIN_BOOTSTRAP_TOKEN;
    if (!isAccountBootstrap) await requireAdminPanelAccess(request);
  });

  await registerHealthRoutes(app);
  await registerAuthModule(app);
  await registerAdminModule(app);
  await registerAuditModule(app);
  await registerContentModule(app);
  await registerLegalModule(app);
  await registerLibraryModule(app);
  await registerMediaModule(app);
  await registerModerationModule(app);
  await registerMusicModule(app);
  await registerPlatformModule(app);
  await registerVideoModule(app);
  await registerWorkflowModule(app);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Проверьте переданные параметры",
        details: error.flatten(),
      });
    }

    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "Внутренняя ошибка Mecorion API",
    });
  });

  return app;
}
