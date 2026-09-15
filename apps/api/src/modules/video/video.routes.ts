import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query} from "../../core/database.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";

const VideoCreateSchema = z.object({
  contentId: z.uuid(),
  videoKind: z.enum(["FILM", "SERIES", "SEASON", "EPISODE", "SHORT", "ANIMATION", "MUSIC_VIDEO"]),
  runtimeMs: z.number().int().positive().optional(),
  ageRatingCode: z.string().trim().max(32).optional(),
  isInteractive: z.boolean().default(false),
});

export async function registerVideoRoutes(app: FastifyInstance) {
  app.get("/api/v1/video/items", async () => {
    const result = await query(`
      SELECT
        contentItem."publicId"::TEXT AS "id",
        contentItem."originalTitle" AS "title",
        contentItem."releaseDt" AS "releaseDate",
        video."videoKind",
        video."runtimeMs",
        video."ageRatingCode",
        video."isInteractive"
      FROM video."tVideo" video
      JOIN content."tContent" contentItem ON contentItem."id" = video."contentId"
      WHERE contentItem."retireDtm" IS NULL
      ORDER BY contentItem."createDtm" DESC
      LIMIT 100
    `);
    return {items: result.rows};
  });

  app.get("/api/v1/video/items/:contentPublicId", async (request) => {
    const params = z.object({contentPublicId: z.uuid()}).parse(request.params);
    const result = await query(`
      SELECT
        contentItem."publicId"::TEXT AS "id",
        contentItem."originalTitle" AS "title",
        contentItem."metadata",
        video."videoKind",
        video."runtimeMs",
        video."ageRatingCode",
        video."isInteractive"
      FROM video."tVideo" video
      JOIN content."tContent" contentItem ON contentItem."id" = video."contentId"
      WHERE contentItem."publicId" = $1
    `, [params.contentPublicId]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "VIDEO_NOT_FOUND", "Видео не найдено");
    return row;
  });

  app.post("/api/v1/admin/video/items", async (request, reply) => {
    await requirePermission(request, "content.submit");
    const input = VideoCreateSchema.parse(request.body);
    const result = await query(`
      INSERT INTO video."tVideo" ("contentId", "videoKind", "runtimeMs", "ageRatingCode", "isInteractive")
      SELECT contentItem."id", $2, $3, $4, $5
      FROM content."tContent" contentItem
      WHERE contentItem."publicId" = $1
      RETURNING "contentId"
    `, [input.contentId, input.videoKind, input.runtimeMs ?? null, input.ageRatingCode ?? null, input.isInteractive]);
    if (result.rowCount === 0) throw new ApiError(404, "CONTENT_NOT_FOUND", "Контент для видео не найден");
    return reply.status(201).send({ok: true});
  });
}
