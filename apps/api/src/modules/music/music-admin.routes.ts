import {createHash, randomUUID} from "node:crypto";
import {createWriteStream} from "node:fs";
import {mkdir, rename, unlink} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {Transform} from "node:stream";
import {pipeline} from "node:stream/promises";
import type {FastifyInstance, FastifyRequest} from "fastify";
import {z} from "zod";
import {config} from "../../core/config.js";
import {query, withTransaction, type DatabaseClient} from "../../core/database.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission, type AuthContext} from "../../core/http/auth-context.js";

const IdParams = z.object({id: z.uuid()});
const ListQuery = z.object({q: z.string().trim().max(200).optional(), status: z.string().trim().max(32).optional(), limit: z.coerce.number().int().min(1).max(200).default(100)});
const ArtistBody = z.object({name: z.string().trim().min(1).max(512), kindCode: z.enum(["PERSON", "GROUP", "ORGANIZATION"]).default("PERSON"), statusCode: z.enum(["DRAFT", "PENDING", "ACTIVE", "RESTRICTED", "RETIRED"]).default("DRAFT"), description: z.string().trim().max(5000).nullable().optional()});
const AlbumBody = z.object({
  title: z.string().trim().min(1).max(512), statusCode: z.string().trim().min(2).max(32).default("DRAFT"),
  albumTypeCode: z.string().trim().min(2).max(32).default("ALBUM"), languageCode: z.string().trim().min(2).max(16).nullable().optional(),
  releaseDate: z.string().date().nullable().optional(), upc: z.string().trim().max(32).nullable().optional(),
  discCount: z.number().int().min(1).max(99).default(1), artistIds: z.array(z.uuid()).default([]), metadata: z.record(z.string(), z.unknown()).default({}),
});
const TrackBody = z.object({
  title: z.string().trim().min(1).max(512), statusCode: z.string().trim().min(2).max(32).default("DRAFT"),
  languageCode: z.string().trim().min(2).max(16).nullable().optional(), releaseDate: z.string().date().nullable().optional(),
  durationMs: z.number().int().positive().nullable().optional(), isrc: z.string().trim().regex(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/).nullable().optional(),
  bpm: z.number().positive().max(999).nullable().optional(), musicalKey: z.string().trim().max(16).nullable().optional(),
  isExplicit: z.boolean().default(false), previewStartMs: z.number().int().min(0).nullable().optional(), artistIds: z.array(z.uuid()).default([]),
  albumId: z.uuid().nullable().optional(), discNumber: z.number().int().min(1).max(99).default(1), trackNumber: z.number().int().min(1).max(999).default(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
const QuickTrackBody = z.object({
  title: z.string().trim().min(1).max(512),
  artistId: z.uuid().optional(),
  albumId: z.uuid().optional(),
});
const AlbumTracksBody = z.object({tracks: z.array(z.object({trackId: z.uuid(), discNumber: z.number().int().min(1).max(99), trackNumber: z.number().int().min(1).max(999)})).max(500)});
const LyricsBody = z.object({languageCode: z.string().trim().min(2).max(16), type: z.enum(["ORIGINAL", "TRANSLATION", "ROMANIZATION"]).default("ORIGINAL"), text: z.string().trim().min(1).max(100_000), isPrimary: z.boolean().default(true)});

const normalize = (value: string) => value.trim().toLocaleLowerCase("ru-RU");

async function createContentResource(client: DatabaseClient) {
  const result = await client.query<{id: string}>(`INSERT INTO core."tResource" ("resourceTypeId") SELECT "id" FROM core."tResourceType" WHERE "code" = 'content' RETURNING "id"`);
  if (!result.rows[0]) throw new ApiError(500, "CONTENT_RESOURCE_TYPE_MISSING", "Тип ресурса content не настроен");
  return result.rows[0].id;
}

async function replaceArtists(client: DatabaseClient, contentId: string, artistIds: string[]) {
  await client.query(`DELETE FROM content."tContentContributor" WHERE "contentId" = $1 AND "contributorRoleId" = (SELECT "id" FROM content."tContributorRole" WHERE "code" = 'PRIMARY_ARTIST')`, [contentId]);
  const inserted = await client.query(`
    INSERT INTO content."tContentContributor" ("contentId", "contributorId", "contributorRoleId", "ordinal")
    SELECT $1, contributor."id", role."id", artist."ordinal"::INTEGER
    FROM unnest($2::UUID[]) WITH ORDINALITY artist("publicId", "ordinal")
    JOIN content."tContributor" contributor ON contributor."publicId" = artist."publicId" AND contributor."retireDtm" IS NULL
    CROSS JOIN content."tContributorRole" role WHERE role."code" = 'PRIMARY_ARTIST'
  `, [contentId, artistIds]);
  if (inserted.rowCount !== artistIds.length) throw new ApiError(400, "ARTIST_NOT_FOUND", "Один или несколько исполнителей не найдены");
}

async function findMusicContent(client: DatabaseClient, publicId: string, type: "TRACK" | "ALBUM") {
  const result = await client.query<{id: string; title: string}>(`
    SELECT item."id"::TEXT AS "id", item."originalTitle" AS "title" FROM content."tContent" item
    JOIN content."tContentType" type ON type."id" = item."contentTypeId"
    WHERE item."publicId" = $1 AND type."code" = $2 AND item."retireDtm" IS NULL
  `, [publicId, type]);
  const row = result.rows[0];
  if (!row) throw new ApiError(404, `${type}_NOT_FOUND`, type === "TRACK" ? "Трек не найден" : "Альбом не найден");
  return row;
}

const uploadKinds = {
  audio: {extensions: {"audio/mpeg": ".mp3", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a", "audio/flac": ".flac", "audio/x-flac": ".flac", "audio/wav": ".wav", "audio/x-wav": ".wav", "audio/wave": ".wav", "audio/vnd.wave": ".wav", "audio/ogg": ".ogg"}, assetType: "AUDIO", role: "PRIMARY_AUDIO", directory: "music/source", maxBytes: 536_870_912},
  cover: {extensions: {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif"}, assetType: "IMAGE", role: "COVER", directory: "music/covers", maxBytes: 20_971_520},
} as const;

function uploadLimitError(error: unknown): never {
  if (error instanceof Error && "code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") {
    throw new ApiError(413, "FILE_TOO_LARGE", "Файл превышает разрешённый размер");
  }
  throw error;
}

// The stream is hashed while being written. The DB only receives a verified
// storage key; original user filenames never become filesystem paths.
type MusicUploadFile = NonNullable<Awaited<ReturnType<FastifyRequest["file"]>>>;

function uploadField(file: MusicUploadFile, name: string) {
  const field = file.fields[name];
  return field && !Array.isArray(field) && "value" in field ? String(field.value ?? "") : "";
}

async function storeMusicFile(
  request: FastifyRequest, actor: AuthContext, contentPublicId: string | null,
  contentType: "TRACK" | "ALBUM", kind: keyof typeof uploadKinds,
  createContent?: (client: DatabaseClient, file: MusicUploadFile) => Promise<{id: string; title: string; publicId: string}>,
) {
  const policy = uploadKinds[kind];
  // The limit must be enforced by the API as well as the file picker.
  const file = await request.file({limits: {fileSize: Math.min(policy.maxBytes, config.MEDIA_MAX_UPLOAD_BYTES)}}).catch(uploadLimitError);
  if (!file) throw new ApiError(400, "FILE_REQUIRED", "Выберите файл для загрузки");
  const extension = (policy.extensions as Record<string, string>)[file.mimetype];
  if (!extension) throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", `Формат ${file.mimetype} не поддерживается`);
  const objectKey = `${policy.directory}/${randomUUID()}${extension}`;
  const storageRoot = resolve(config.MEDIA_STORAGE_ROOT);
  const targetPath = resolve(storageRoot, objectKey);
  if (!targetPath.startsWith(`${storageRoot}/`)) throw new ApiError(400, "INVALID_STORAGE_PATH", "Некорректный путь файла");
  const temporaryPath = `${targetPath}.part`;
  await mkdir(dirname(targetPath), {recursive: true});
  let sizeByte = 0;
  const digest = createHash("sha256");
  const observer = new Transform({transform(chunk, _encoding, callback) { sizeByte += chunk.length; digest.update(chunk); callback(null, chunk); }});
  try {
    await pipeline(file.file, observer, createWriteStream(temporaryPath, {flags: "wx", mode: 0o640}));
    if (file.file.truncated) throw new ApiError(413, "FILE_TOO_LARGE", "Файл превышает разрешённый размер");
    if (sizeByte === 0) throw new ApiError(400, "EMPTY_FILE", "Нельзя загрузить пустой файл");
    await rename(temporaryPath, targetPath);
    return await withTransaction(async (client) => {
      const content = createContent
        ? await createContent(client, file)
        : await findMusicContent(client, contentPublicId!, contentType);
      const object = await client.query<{id: string; publicId: string}>(`
        INSERT INTO media."tStorageObject" ("storageProviderId", "storageObjectStatusId", "bucketName", "objectKey", "sizeByte", "contentType", "sha256Digest", "verifyDtm")
        SELECT provider."id", status."id", 'local-data', $1, $2, $3, decode($4, 'hex'), CURRENT_TIMESTAMP
        FROM media."tStorageProvider" provider CROSS JOIN media."tStorageObjectStatus" status
        WHERE provider."code" = 'local-data' AND status."code" = 'AVAILABLE'
        RETURNING "id"::TEXT AS "id", "publicId"::TEXT AS "publicId"
      `, [objectKey, sizeByte, file.mimetype, digest.digest("hex")]);
      const objectRow = object.rows[0];
      if (!objectRow) throw new ApiError(500, "LOCAL_STORAGE_NOT_CONFIGURED", "Выполните npm run db:seed для настройки local-data");
      const asset = await client.query<{id: string; publicId: string}>(`
        INSERT INTO media."tAsset" ("assetTypeId", "assetStatusId", "title", "createByAccountId", "metadata")
        SELECT type."id", status."id", $1, $2, jsonb_build_object('originalFilename', $3::TEXT)
        FROM media."tAssetType" type CROSS JOIN media."tAssetStatus" status
        WHERE type."code" = $4 AND status."code" = 'READY'
        RETURNING "id"::TEXT AS "id", "publicId"::TEXT AS "publicId"
      `, [content.title, actor.accountId, file.filename, policy.assetType]);
      const assetRow = asset.rows[0]!;
      await client.query(`INSERT INTO media."tAssetVariant" ("assetId", "storageObjectId", "variantCode", "container", "isSource") VALUES ($1, $2, 'SOURCE', $3, TRUE)`, [assetRow.id, objectRow.id, extension.replace(".", "") || null]);
      await client.query(`UPDATE media."tContentAsset" SET "isPrimary" = FALSE WHERE "contentId" = $1 AND "contentAssetRoleId" = (SELECT "id" FROM media."tContentAssetRole" WHERE "code" = $2)`, [content.id, policy.role]);
      await client.query(`INSERT INTO media."tContentAsset" ("contentId", "assetId", "contentAssetRoleId", "isPrimary") SELECT $1, $2, "id", TRUE FROM media."tContentAssetRole" WHERE "code" = $3`, [content.id, assetRow.id, policy.role]);
      return {id: "publicId" in content ? content.publicId : contentPublicId, assetId: assetRow.publicId, storageObjectId: objectRow.publicId, objectKey, sizeByte};
    });
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    await unlink(targetPath).catch(() => undefined);
    uploadLimitError(error);
  }
}

export async function registerMusicAdminRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/music/references", async (request) => {
    await requirePermission(request, "content.submit");
    const [statuses, albumTypes, languages, artistKinds] = await Promise.all([
      query(`SELECT "code", "name" FROM content."tContentStatus" ORDER BY "id"`), query(`SELECT "code", "name" FROM music."tAlbumType" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM core."tLanguage" WHERE "isActive" = TRUE ORDER BY "name"`), query(`SELECT "code", "name" FROM content."tContributorKind" ORDER BY "id"`),
    ]);
    return {statuses: statuses.rows, albumTypes: albumTypes.rows, languages: languages.rows, artistKinds: artistKinds.rows};
  });

  app.get("/api/v1/admin/music/artists", async (request) => {
    await requirePermission(request, "content.submit"); const filters = ListQuery.parse(request.query);
    const result = await query(`
      SELECT artist."publicId"::TEXT AS "id", artist."primaryName" AS "name", artist."description", kind."code" AS "kind", musicArtist."artistStatus" AS "status",
        COUNT(DISTINCT link."contentId")::INTEGER AS "releaseCount", artist."createDtm"
      FROM music."tArtist" musicArtist JOIN content."tContributor" artist ON artist."id" = musicArtist."contributorId"
      JOIN content."tContributorKind" kind ON kind."id" = artist."contributorKindId"
      LEFT JOIN content."tContentContributor" link ON link."contributorId" = artist."id"
      LEFT JOIN content."tContent" item ON item."id" = link."contentId" LEFT JOIN content."tContentType" type ON type."id" = item."contentTypeId"
      WHERE artist."retireDtm" IS NULL
        AND ($1::TEXT IS NULL OR artist."primaryName" ILIKE '%' || $1 || '%')
        AND ($2::TEXT IS NULL OR musicArtist."artistStatus" = $2)
      GROUP BY artist."id", kind."code", musicArtist."artistStatus" ORDER BY artist."primaryName" LIMIT $3
    `, [filters.q ?? null, filters.status ?? null, filters.limit]); return {items: result.rows};
  });

  app.post("/api/v1/admin/music/artists", async (request, reply) => {
    const actor = await requirePermission(request, "content.submit"); const input = ArtistBody.parse(request.body);
    const result = await withTransaction(async (client) => {
      const resource = await client.query<{id: string}>(`INSERT INTO core."tResource" ("resourceTypeId") SELECT "id" FROM core."tResourceType" WHERE "code" = 'contributor' RETURNING "id"`);
      const created = await client.query<{id: string}>(`
        INSERT INTO content."tContributor" ("resourceId", "contributorKindId", "primaryName", "normalizedName", "description", "createByAccountId")
        SELECT $1, kind."id", $2, $3, $4, $5 FROM content."tContributorKind" kind WHERE kind."code" = $6 RETURNING "publicId"::TEXT AS "id"
      `, [resource.rows[0]!.id, input.name, normalize(input.name), input.description ?? null, actor.accountId, input.kindCode]);
      if (!created.rows[0]) throw new ApiError(400, "ARTIST_KIND_NOT_FOUND", "Тип исполнителя не найден");
      await client.query(`INSERT INTO music."tArtist" ("contributorId", "artistStatus") SELECT "id", $2 FROM content."tContributor" WHERE "publicId" = $1`, [created.rows[0].id, input.statusCode]);
      return created.rows[0];
    }); return reply.status(201).send(result);
  });

  app.patch("/api/v1/admin/music/artists/:id", async (request) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params); const input = ArtistBody.parse(request.body);
    await withTransaction(async (client) => {
      const result = await client.query(`UPDATE content."tContributor" artist SET "contributorKindId" = kind."id", "primaryName" = $2, "normalizedName" = $3, "description" = $4, "updateDtm" = CURRENT_TIMESTAMP FROM content."tContributorKind" kind WHERE artist."publicId" = $1 AND artist."retireDtm" IS NULL AND kind."code" = $5 RETURNING artist."id"`, [id, input.name, normalize(input.name), input.description ?? null, input.kindCode]);
      if (!result.rows[0]) throw new ApiError(404, "ARTIST_NOT_FOUND", "Исполнитель не найден");
      await client.query(`UPDATE music."tArtist" SET "artistStatus" = $2 WHERE "contributorId" = $1`, [result.rows[0].id, input.statusCode]);
    }); return {ok: true};
  });

  app.delete("/api/v1/admin/music/artists/:id", async (request) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params);
    const result = await withTransaction(async (client) => { const retired = await client.query<{id: string}>(`UPDATE content."tContributor" SET "retireDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1 AND "retireDtm" IS NULL RETURNING "id"`, [id]); if (retired.rows[0]) await client.query(`UPDATE music."tArtist" SET "artistStatus" = 'RETIRED' WHERE "contributorId" = $1`, [retired.rows[0].id]); return retired; });
    if (!result.rowCount) throw new ApiError(404, "ARTIST_NOT_FOUND", "Исполнитель не найден"); return {ok: true};
  });

  app.get("/api/v1/admin/music/albums", async (request) => {
    await requirePermission(request, "content.submit"); const filters = ListQuery.parse(request.query);
    const result = await query(`
      SELECT item."publicId"::TEXT AS "id", item."originalTitle" AS "title", status."code" AS "status", albumType."code" AS "albumType",
        album."upc", album."releaseDt" AS "releaseDate", album."discCount", language."code" AS "languageCode", item."metadata", COUNT(DISTINCT albumTrack."trackContentId")::INTEGER AS "trackCount",
        COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', artist."publicId"::TEXT, 'name', artist."primaryName")) FILTER (WHERE artist."id" IS NOT NULL), '[]') AS "artists",
        cover."publicId"::TEXT AS "coverAssetId"
      FROM music."tAlbum" album JOIN content."tContent" item ON item."id" = album."contentId" JOIN content."tContentStatus" status ON status."id" = item."contentStatusId"
      JOIN music."tAlbumType" albumType ON albumType."id" = album."albumTypeId" LEFT JOIN core."tLanguage" language ON language."id" = item."originalLanguageId" LEFT JOIN music."tAlbumTrack" albumTrack ON albumTrack."albumContentId" = album."contentId"
      LEFT JOIN content."tContentContributor" artistLink ON artistLink."contentId" = album."contentId" LEFT JOIN content."tContributor" artist ON artist."id" = artistLink."contributorId"
      LEFT JOIN media."tContentAsset" coverLink ON coverLink."contentId" = album."contentId" AND coverLink."isPrimary" = TRUE AND coverLink."contentAssetRoleId" = (SELECT "id" FROM media."tContentAssetRole" WHERE "code" = 'COVER')
      LEFT JOIN media."tAsset" cover ON cover."id" = coverLink."assetId"
      WHERE item."retireDtm" IS NULL AND ($1::TEXT IS NULL OR item."originalTitle" ILIKE '%' || $1 || '%') AND ($2::TEXT IS NULL OR status."code" = $2)
      GROUP BY item."id", status."code", albumType."code", album."contentId", language."code", cover."publicId" ORDER BY item."createDtm" DESC LIMIT $3
    `, [filters.q ?? null, filters.status ?? null, filters.limit]); return {items: result.rows};
  });

  app.post("/api/v1/admin/music/albums", async (request, reply) => {
    const actor = await requirePermission(request, "content.submit"); const input = AlbumBody.parse(request.body);
    const created = await withTransaction(async (client) => {
      const resourceId = await createContentResource(client);
      const content = await client.query<{id: string; publicId: string}>(`
        INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalLanguageId", "originalTitle", "releaseDt", "metadata", "createByAccountId")
        SELECT $1, type."id", status."id", language."id", $2, $3, $4::JSONB, $5 FROM content."tContentType" type CROSS JOIN content."tContentStatus" status
        LEFT JOIN core."tLanguage" language ON language."code" = $6 WHERE type."code" = 'ALBUM' AND status."code" = $7 RETURNING "id"::TEXT AS "id", "publicId"::TEXT AS "publicId"
      `, [resourceId, input.title, input.releaseDate ?? null, JSON.stringify(input.metadata), actor.accountId, input.languageCode ?? null, input.statusCode]);
      const row = content.rows[0]; if (!row) throw new ApiError(400, "ALBUM_REFERENCE_NOT_FOUND", "Статус или язык не найдены");
      const album = await client.query(`INSERT INTO music."tAlbum" ("contentId", "albumTypeId", "upc", "releaseDt", "discCount") SELECT $1, "id", $2, $3, $4 FROM music."tAlbumType" WHERE "code" = $5 RETURNING "contentId"`, [row.id, input.upc ?? null, input.releaseDate ?? null, input.discCount, input.albumTypeCode]);
      if (!album.rowCount) throw new ApiError(400, "ALBUM_TYPE_NOT_FOUND", "Тип альбома не найден"); await replaceArtists(client, row.id, input.artistIds); return {id: row.publicId};
    }); return reply.status(201).send(created);
  });

  app.patch("/api/v1/admin/music/albums/:id", async (request) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params); const input = AlbumBody.parse(request.body);
    await withTransaction(async (client) => {
      const content = await findMusicContent(client, id, "ALBUM");
      const updated = await client.query(`UPDATE content."tContent" item SET "contentStatusId" = status."id", "originalLanguageId" = language."id", "originalTitle" = $2, "releaseDt" = $3, "metadata" = $4::JSONB, "updateDtm" = CURRENT_TIMESTAMP FROM content."tContentStatus" status LEFT JOIN core."tLanguage" language ON language."code" = $5 WHERE item."id" = $1 AND status."code" = $6 RETURNING item."id"`, [content.id, input.title, input.releaseDate ?? null, JSON.stringify(input.metadata), input.languageCode ?? null, input.statusCode]);
      if (!updated.rowCount) throw new ApiError(400, "ALBUM_REFERENCE_NOT_FOUND", "Статус или язык не найдены");
      const album = await client.query(`UPDATE music."tAlbum" album SET "albumTypeId" = type."id", "upc" = $2, "releaseDt" = $3, "discCount" = $4, "updateDtm" = CURRENT_TIMESTAMP FROM music."tAlbumType" type WHERE album."contentId" = $1 AND type."code" = $5 RETURNING album."contentId"`, [content.id, input.upc ?? null, input.releaseDate ?? null, input.discCount, input.albumTypeCode]);
      if (!album.rowCount) throw new ApiError(400, "ALBUM_TYPE_NOT_FOUND", "Тип альбома не найден");
      await replaceArtists(client, content.id, input.artistIds);
    }); return {ok: true};
  });

  app.put("/api/v1/admin/music/albums/:id/tracks", async (request) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params); const input = AlbumTracksBody.parse(request.body);
    await withTransaction(async (client) => {
      const album = await findMusicContent(client, id, "ALBUM"); await client.query(`DELETE FROM music."tAlbumTrack" WHERE "albumContentId" = $1`, [album.id]);
      for (const track of input.tracks) {
        const inserted = await client.query(`INSERT INTO music."tAlbumTrack" ("albumContentId", "trackContentId", "discNumber", "trackNumber") SELECT $1, musicTrack."contentId", $3, $4 FROM music."tTrack" musicTrack JOIN content."tContent" item ON item."id" = musicTrack."contentId" WHERE item."publicId" = $2 AND item."retireDtm" IS NULL`, [album.id, track.trackId, track.discNumber, track.trackNumber]);
        if (!inserted.rowCount) throw new ApiError(400, "TRACK_NOT_FOUND", "Трек из состава альбома не найден");
      }
    }); return {ok: true};
  });

  app.delete("/api/v1/admin/music/albums/:id", async (request) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params);
    const result = await query(`UPDATE content."tContent" SET "retireDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1 AND "retireDtm" IS NULL RETURNING "publicId"`, [id]);
    if (!result.rowCount) throw new ApiError(404, "ALBUM_NOT_FOUND", "Альбом не найден"); return {ok: true};
  });

  app.get("/api/v1/admin/music/tracks", async (request) => {
    await requirePermission(request, "content.submit"); const filters = ListQuery.parse(request.query);
    const result = await query(`
      SELECT item."publicId"::TEXT AS "id", item."originalTitle" AS "title", status."code" AS "status", language."code" AS "languageCode", item."releaseDt" AS "releaseDate", item."durationMs",
        track."isrc", track."bpm"::FLOAT AS "bpm", track."musicalKey", track."isExplicit", track."previewStartMs", item."metadata",
        albumItem."publicId"::TEXT AS "albumId", albumItem."originalTitle" AS "albumTitle", albumTrack."discNumber", albumTrack."trackNumber",
        COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', artist."publicId"::TEXT, 'name', artist."primaryName")) FILTER (WHERE artist."id" IS NOT NULL), '[]') AS "artists",
        audio."publicId"::TEXT AS "audioAssetId"
      FROM music."tTrack" track JOIN content."tContent" item ON item."id" = track."contentId" JOIN content."tContentStatus" status ON status."id" = item."contentStatusId" LEFT JOIN core."tLanguage" language ON language."id" = item."originalLanguageId"
      LEFT JOIN music."tAlbumTrack" albumTrack ON albumTrack."trackContentId" = track."contentId" LEFT JOIN content."tContent" albumItem ON albumItem."id" = albumTrack."albumContentId"
      LEFT JOIN content."tContentContributor" artistLink ON artistLink."contentId" = track."contentId" LEFT JOIN content."tContributor" artist ON artist."id" = artistLink."contributorId"
      LEFT JOIN media."tContentAsset" audioLink ON audioLink."contentId" = track."contentId" AND audioLink."isPrimary" = TRUE AND audioLink."contentAssetRoleId" = (SELECT "id" FROM media."tContentAssetRole" WHERE "code" = 'PRIMARY_AUDIO')
      LEFT JOIN media."tAsset" audio ON audio."id" = audioLink."assetId"
      WHERE item."retireDtm" IS NULL AND ($1::TEXT IS NULL OR item."originalTitle" ILIKE '%' || $1 || '%') AND ($2::TEXT IS NULL OR status."code" = $2)
      GROUP BY item."id", status."code", language."code", track."contentId", albumItem."publicId", albumItem."originalTitle", albumTrack."discNumber", albumTrack."trackNumber", audio."publicId"
      ORDER BY item."createDtm" DESC LIMIT $3
    `, [filters.q ?? null, filters.status ?? null, filters.limit]); return {items: result.rows};
  });

  async function saveTrack(request: FastifyRequest, actor: AuthContext, id?: string) {
    const input = TrackBody.parse(request.body);
    return withTransaction(async (client) => {
      let content: {id: string; publicId: string};
      if (id) {
        const found = await findMusicContent(client, id, "TRACK"); content = {id: found.id, publicId: id};
        const updated = await client.query(`UPDATE content."tContent" item SET "contentStatusId" = status."id", "originalLanguageId" = language."id", "originalTitle" = $2, "releaseDt" = $3, "durationMs" = $4, "metadata" = $5::JSONB, "updateDtm" = CURRENT_TIMESTAMP FROM content."tContentStatus" status LEFT JOIN core."tLanguage" language ON language."code" = $6 WHERE item."id" = $1 AND status."code" = $7 RETURNING item."id"`, [content.id, input.title, input.releaseDate ?? null, input.durationMs ?? null, JSON.stringify(input.metadata), input.languageCode ?? null, input.statusCode]);
        if (!updated.rowCount) throw new ApiError(400, "TRACK_REFERENCE_NOT_FOUND", "Статус или язык не найдены");
        await client.query(`UPDATE music."tTrack" SET "isrc" = $2, "bpm" = $3, "musicalKey" = $4, "isExplicit" = $5, "previewStartMs" = $6, "updateDtm" = CURRENT_TIMESTAMP WHERE "contentId" = $1`, [content.id, input.isrc ?? null, input.bpm ?? null, input.musicalKey ?? null, input.isExplicit, input.previewStartMs ?? null]);
      } else {
        const resourceId = await createContentResource(client);
        const created = await client.query<{id: string; publicId: string}>(`INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalLanguageId", "originalTitle", "releaseDt", "durationMs", "metadata", "createByAccountId") SELECT $1, type."id", status."id", language."id", $2, $3, $4, $5::JSONB, $6 FROM content."tContentType" type CROSS JOIN content."tContentStatus" status LEFT JOIN core."tLanguage" language ON language."code" = $7 WHERE type."code" = 'TRACK' AND status."code" = $8 RETURNING "id"::TEXT AS "id", "publicId"::TEXT AS "publicId"`, [resourceId, input.title, input.releaseDate ?? null, input.durationMs ?? null, JSON.stringify(input.metadata), actor.accountId, input.languageCode ?? null, input.statusCode]);
        content = created.rows[0]!; if (!content) throw new ApiError(400, "TRACK_REFERENCE_NOT_FOUND", "Статус или язык не найдены");
        await client.query(`INSERT INTO music."tTrack" ("contentId", "isrc", "bpm", "musicalKey", "isExplicit", "previewStartMs") VALUES ($1, $2, $3, $4, $5, $6)`, [content.id, input.isrc ?? null, input.bpm ?? null, input.musicalKey ?? null, input.isExplicit, input.previewStartMs ?? null]);
      }
      await replaceArtists(client, content.id, input.artistIds); await client.query(`DELETE FROM music."tAlbumTrack" WHERE "trackContentId" = $1`, [content.id]);
      if (input.albumId) { const album = await findMusicContent(client, input.albumId, "ALBUM"); await client.query(`INSERT INTO music."tAlbumTrack" ("albumContentId", "trackContentId", "discNumber", "trackNumber") VALUES ($1, $2, $3, $4)`, [album.id, content.id, input.discNumber, input.trackNumber]); }
      return {id: content.publicId};
    });
  }

  app.post("/api/v1/admin/music/tracks", async (request, reply) => { const actor = await requirePermission(request, "content.submit"); return reply.status(201).send(await saveTrack(request, actor)); });
  app.post("/api/v1/admin/music/tracks/upload", async (request, reply) => {
    const actor = await requirePermission(request, "content.upload");
    await requirePermission(request, "content.submit");
    const result = await storeMusicFile(request, actor, null, "TRACK", "audio", async (client, file) => {
      const title = uploadField(file, "title").trim() || file.filename.replace(/\.[^.]+$/, "").trim();
      const input = QuickTrackBody.parse({title, artistId: uploadField(file, "artistId") || undefined, albumId: uploadField(file, "albumId") || undefined});
      const resourceId = await createContentResource(client);
      const created = await client.query<{id: string; publicId: string}>(`
        INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalTitle", "createByAccountId")
        SELECT $1, type."id", status."id", $2, $3
        FROM content."tContentType" type CROSS JOIN content."tContentStatus" status
        WHERE type."code" = 'TRACK' AND status."code" = 'ACTIVE'
        RETURNING "id"::TEXT AS "id", "publicId"::TEXT AS "publicId"
      `, [resourceId, input.title, actor.accountId]);
      const content = created.rows[0];
      if (!content) throw new ApiError(500, "TRACK_REFERENCE_NOT_FOUND", "Тип трека или статус ACTIVE не настроен");
      await client.query(`INSERT INTO music."tTrack" ("contentId") VALUES ($1)`, [content.id]);
      if (input.artistId) await replaceArtists(client, content.id, [input.artistId]);
      if (input.albumId) {
        const album = await findMusicContent(client, input.albumId, "ALBUM");
        const next = await client.query<{number: number}>(`
          SELECT COALESCE(MAX("trackNumber"), 0) + 1 AS "number" FROM music."tAlbumTrack" WHERE "albumContentId" = $1 AND "discNumber" = 1
        `, [album.id]);
        await client.query(`INSERT INTO music."tAlbumTrack" ("albumContentId", "trackContentId", "discNumber", "trackNumber") VALUES ($1, $2, 1, $3)`, [album.id, content.id, next.rows[0]!.number]);
      }
      return {...content, title: input.title};
    });
    return reply.status(201).send(result);
  });
  app.patch("/api/v1/admin/music/tracks/:id", async (request) => { const actor = await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params); await saveTrack(request, actor, id); return {ok: true}; });
  app.delete("/api/v1/admin/music/tracks/:id", async (request) => { await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params); const result = await query(`UPDATE content."tContent" SET "retireDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1 AND "retireDtm" IS NULL RETURNING "publicId"`, [id]); if (!result.rowCount) throw new ApiError(404, "TRACK_NOT_FOUND", "Трек не найден"); return {ok: true}; });

  app.get("/api/v1/admin/music/tracks/:id/lyrics", async (request) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params);
    const result = await query(`SELECT lyrics."publicId"::TEXT AS "id", language."code" AS "languageCode", lyrics."lyricsType" AS "type", lyrics."plainText" AS "text", lyrics."isPrimary" FROM music."tLyrics" lyrics JOIN music."tTrack" track ON track."contentId" = lyrics."trackContentId" JOIN content."tContent" item ON item."id" = track."contentId" JOIN core."tLanguage" language ON language."id" = lyrics."languageId" WHERE item."publicId" = $1 ORDER BY lyrics."isPrimary" DESC, language."code"`, [id]); return {items: result.rows};
  });
  app.put("/api/v1/admin/music/tracks/:id/lyrics", async (request, reply) => {
    await requirePermission(request, "content.submit"); const {id} = IdParams.parse(request.params); const input = LyricsBody.parse(request.body);
    const saved = await withTransaction(async (client) => { const track = await findMusicContent(client, id, "TRACK"); if (input.isPrimary) await client.query(`UPDATE music."tLyrics" SET "isPrimary" = FALSE WHERE "trackContentId" = $1 AND "languageId" = (SELECT "id" FROM core."tLanguage" WHERE "code" = $2)`, [track.id, input.languageCode]); const result = await client.query<{id: string}>(`INSERT INTO music."tLyrics" ("trackContentId", "languageId", "lyricsType", "plainText", "isPrimary") SELECT $1, language."id", $3, $4, $5 FROM core."tLanguage" language WHERE language."code" = $2 ON CONFLICT ("trackContentId", "languageId", "lyricsType") DO UPDATE SET "plainText" = EXCLUDED."plainText", "isPrimary" = EXCLUDED."isPrimary", "updateDtm" = CURRENT_TIMESTAMP RETURNING "publicId"::TEXT AS "id"`, [track.id, input.languageCode, input.type, input.text, input.isPrimary]); if (!result.rows[0]) throw new ApiError(400, "LANGUAGE_NOT_FOUND", "Язык текста не найден"); return result.rows[0]; }); return reply.status(201).send(saved);
  });

  app.post("/api/v1/admin/music/tracks/:id/audio", async (request, reply) => { const actor = await requirePermission(request, "content.upload"); const {id} = IdParams.parse(request.params); return reply.status(201).send(await storeMusicFile(request, actor, id, "TRACK", "audio")); });
  app.post("/api/v1/admin/music/albums/:id/cover", async (request, reply) => { const actor = await requirePermission(request, "content.upload"); const {id} = IdParams.parse(request.params); return reply.status(201).send(await storeMusicFile(request, actor, id, "ALBUM", "cover")); });
}
