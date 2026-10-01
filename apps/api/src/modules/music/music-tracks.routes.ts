import {createReadStream} from "node:fs";
import {stat} from "node:fs/promises";
import {resolve} from "node:path";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {config} from "../../core/config.js";
import {query} from "../../core/database.js";
import {ApiError} from "../../core/http/api-error.js";

const TrackQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
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
        COALESCE(array_agg(DISTINCT contributor."primaryName") FILTER (WHERE contributor."primaryName" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "artists",
        (SELECT albumItem."originalTitle" FROM music."tAlbumTrack" membership
         JOIN content."tContent" albumItem ON albumItem."id" = membership."albumContentId"
         WHERE membership."trackContentId" = track."contentId" AND albumItem."retireDtm" IS NULL
         ORDER BY membership."createDtm" LIMIT 1) AS "album"
      FROM music."tTrack" track
      JOIN content."tContent" contentItem ON contentItem."id" = track."contentId"
      JOIN content."tContentStatus" contentStatus ON contentStatus."id" = contentItem."contentStatusId"
      LEFT JOIN content."tContentContributor" contentContributor ON contentContributor."contentId" = contentItem."id"
      LEFT JOIN content."tContributor" contributor ON contributor."id" = contentContributor."contributorId"
      WHERE contentItem."retireDtm" IS NULL
        AND contentStatus."code" = 'ACTIVE'
        AND EXISTS (
          SELECT 1 FROM media."tContentAsset" link
          JOIN media."tContentAssetRole" role ON role."id" = link."contentAssetRoleId" AND role."code" = 'PRIMARY_AUDIO'
          JOIN media."tAssetVariant" variant ON variant."assetId" = link."assetId" AND variant."isSource" = TRUE
          JOIN media."tStorageObject" object ON object."id" = variant."storageObjectId" AND object."deleteDtm" IS NULL
          JOIN media."tStorageProvider" provider ON provider."id" = object."storageProviderId" AND provider."code" = 'local-data'
          WHERE link."contentId" = track."contentId" AND link."isPrimary" = TRUE
        )
        AND ($3::TEXT IS NULL OR contentItem."originalTitle" ILIKE '%' || $3 || '%')
      GROUP BY contentItem."publicId", contentItem."originalTitle", contentItem."durationMs", contentItem."releaseDt", track."contentId", track."bpm", track."isExplicit", contentItem."createDtm"
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
      JOIN content."tContentStatus" contentStatus ON contentStatus."id" = contentItem."contentStatusId"
      WHERE contentItem."publicId" = $1
        AND contentItem."retireDtm" IS NULL
        AND contentStatus."code" = 'ACTIVE'
    `, [params.trackPublicId]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "TRACK_NOT_FOUND", "Трек не найден");
    return row;
  });

  app.get("/api/v1/music/tracks/:trackPublicId/audio", async (request, reply) => {
    const {trackPublicId} = z.object({trackPublicId: z.uuid()}).parse(request.params);
    const result = await query<{objectKey: string; contentType: string | null}>(`
      SELECT object."objectKey", object."contentType" FROM music."tTrack" track
      JOIN content."tContent" item ON item."id" = track."contentId"
      JOIN content."tContentStatus" status ON status."id" = item."contentStatusId" AND status."code" = 'ACTIVE'
      JOIN media."tContentAsset" link ON link."contentId" = item."id" AND link."isPrimary" = TRUE
      JOIN media."tContentAssetRole" role ON role."id" = link."contentAssetRoleId" AND role."code" = 'PRIMARY_AUDIO'
      JOIN media."tAssetVariant" variant ON variant."assetId" = link."assetId" AND variant."isSource" = TRUE
      JOIN media."tStorageObject" object ON object."id" = variant."storageObjectId" AND object."deleteDtm" IS NULL
      JOIN media."tStorageProvider" provider ON provider."id" = object."storageProviderId" AND provider."code" = 'local-data'
      WHERE item."publicId" = $1 AND item."retireDtm" IS NULL LIMIT 1
    `, [trackPublicId]);
    const object = result.rows[0];
    if (!object) throw new ApiError(404, "AUDIO_NOT_FOUND", "Аудиофайл не найден");
    const storageRoot = resolve(config.MEDIA_STORAGE_ROOT);
    const path = resolve(storageRoot, object.objectKey);
    if (!path.startsWith(`${storageRoot}/`)) throw new ApiError(404, "AUDIO_NOT_FOUND", "Аудиофайл не найден");
    const info = await stat(path).catch(() => null);
    if (!info?.isFile()) throw new ApiError(404, "AUDIO_NOT_FOUND", "Аудиофайл не найден");

    let start = 0;
    let end = info.size - 1;
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return reply.status(416).header("Content-Range", `bytes */${info.size}`).send();
      }
      if (!match[1]) {
        const suffix = Number(match[2]);
        start = Math.max(0, info.size - suffix);
      } else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), info.size - 1);
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= info.size || end < start) {
        return reply.status(416).header("Content-Range", `bytes */${info.size}`).send();
      }
      reply.status(206).header("Content-Range", `bytes ${start}-${end}/${info.size}`);
    }
    return reply
      .type(object.contentType || "application/octet-stream")
      .header("Accept-Ranges", "bytes")
      .header("Content-Length", end - start + 1)
      .send(createReadStream(path, {start, end}));
  });

}
