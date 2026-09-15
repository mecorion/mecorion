import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query} from "../../core/database.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";

const TrackQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const TrackCreateSchema = z.object({
  contentId: z.uuid(),
  bpm: z.number().int().min(20).max(300).optional(),
  isExplicit: z.boolean().default(false),
  isrc: z.string().trim().regex(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/).optional(),
});

const AlbumCreateSchema = z.object({
  contentId: z.uuid(),
  albumTypeCode: z.string().trim().min(2).max(32).default("ALBUM"),
  upc: z.string().trim().max(32).optional(),
  releaseDate: z.string().date().optional(),
  discCount: z.number().int().positive().default(1),
});

export async function registerTrackRoutes(app: FastifyInstance) {
  app.get("/api/v1/music/tracks", async (request) => {
    const filters = TrackQuerySchema.parse(request.query);
    const result = await query(`
      SELECT
        contentItem."publicId"::TEXT AS "id",
        contentItem."originalTitle" AS "title",
        contentItem."durationMs",
        contentItem."releaseDt" AS "releaseDate",
        track."bpm",
        track."isExplicit",
        COALESCE(array_agg(DISTINCT contributor."primaryName") FILTER (WHERE contributor."primaryName" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "artists"
      FROM music."tTrack" track
      JOIN content."tContent" contentItem ON contentItem."id" = track."contentId"
      LEFT JOIN content."tContentContributor" contentContributor ON contentContributor."contentId" = contentItem."id"
      LEFT JOIN content."tContributor" contributor ON contributor."id" = contentContributor."contributorId"
      WHERE contentItem."retireDtm" IS NULL
        AND ($3::TEXT IS NULL OR contentItem."originalTitle" ILIKE '%' || $3 || '%')
      GROUP BY contentItem."publicId", contentItem."originalTitle", contentItem."durationMs", contentItem."releaseDt", track."bpm", track."isExplicit", contentItem."createDtm"
      ORDER BY contentItem."createDtm" DESC
      LIMIT $1 OFFSET $2
    `, [filters.limit, filters.offset, filters.q ?? null]);
    return {items: result.rows};
  });

  app.get("/api/v1/music/tracks/:trackPublicId", async (request) => {
    const params = z.object({trackPublicId: z.uuid()}).parse(request.params);
    const result = await query(`
      SELECT
        contentItem."publicId"::TEXT AS "id",
        contentItem."originalTitle" AS "title",
        contentItem."durationMs",
        contentItem."releaseDt" AS "releaseDate",
        contentItem."metadata",
        track."bpm",
        track."isExplicit",
        track."isrc"
      FROM music."tTrack" track
      JOIN content."tContent" contentItem ON contentItem."id" = track."contentId"
      WHERE contentItem."publicId" = $1
    `, [params.trackPublicId]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "TRACK_NOT_FOUND", "Трек не найден");
    return row;
  });

  app.post("/api/v1/admin/music/tracks", async (request, reply) => {
    await requirePermission(request, "content.submit");
    const input = TrackCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO music."tTrack" ("contentId", "bpm", "isExplicit", "isrc")
      SELECT contentItem."id", $2, $3, $4
      FROM content."tContent" contentItem
      WHERE contentItem."publicId" = $1
      RETURNING "contentId"::TEXT AS "id"
    `, [input.contentId, input.bpm ?? null, input.isExplicit, input.isrc ?? null]);
    if (!result.rows[0]) throw new ApiError(404, "CONTENT_NOT_FOUND", "Контент для трека не найден");
    return reply.status(201).send({ok: true});
  });

  app.post("/api/v1/admin/music/albums", async (request, reply) => {
    await requirePermission(request, "content.submit");
    const input = AlbumCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO music."tAlbum" ("contentId", "albumTypeId", "upc", "releaseDt", "discCount")
      SELECT contentItem."id", albumType."id", $3, $4, $5
      FROM content."tContent" contentItem
      JOIN music."tAlbumType" albumType ON albumType."code" = $2
      WHERE contentItem."publicId" = $1
      RETURNING "contentId"::TEXT AS "id"
    `, [input.contentId, input.albumTypeCode, input.upc ?? null, input.releaseDate ?? null, input.discCount]);
    if (!result.rows[0]) throw new ApiError(404, "CONTENT_NOT_FOUND", "Контент или тип альбома не найден");
    return reply.status(201).send({ok: true});
  });

  app.post("/api/v1/admin/music/albums/:albumContentId/tracks", async (request, reply) => {
    await requirePermission(request, "content.submit");
    const params = z.object({albumContentId: z.uuid()}).parse(request.params);
    const body = z.object({
      trackContentId: z.uuid(),
      trackNumber: z.number().int().positive(),
      discNumber: z.number().int().positive().default(1),
    }).parse(request.body);
    const result = await query(`
      INSERT INTO music."tAlbumTrack" ("albumContentId", "trackContentId", "discNumber", "trackNumber")
      SELECT albumContent."id", trackContent."id", $3, $4
      FROM content."tContent" albumContent
      JOIN content."tContent" trackContent ON trackContent."publicId" = $2
      WHERE albumContent."publicId" = $1
    `, [params.albumContentId, body.trackContentId, body.discNumber, body.trackNumber]);
    if (result.rowCount === 0) throw new ApiError(404, "CONTENT_NOT_FOUND", "Альбом или трек не найден");
    return reply.status(201).send({ok: true});
  });
}
