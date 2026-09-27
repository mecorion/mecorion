import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction} from "../../core/database.js";
import {findContentId} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";

const Hex32 = z.string().regex(/^[a-fA-F0-9]{64}$/);

const StorageObjectCreateSchema = z.object({
  providerCode: z.string().min(1).max(64).default("primary-s3"),
  statusCode: z.string().min(1).max(32).default("AVAILABLE"),
  bucketName: z.string().min(1).max(128),
  objectKey: z.string().min(1).max(1024),
  versionId: z.string().max(512).optional(),
  sizeByte: z.number().int().min(0),
  contentType: z.string().max(255).optional(),
  etag: z.string().max(512).optional(),
  sha256Hex: Hex32,
});

const AssetCreateSchema = z.object({
  typeCode: z.string().min(1).max(32),
  statusCode: z.string().min(1).max(32).default("READY"),
  languageCode: z.string().max(16).optional(),
  title: z.string().max(512).optional(),
  durationMs: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const AssetVariantCreateSchema = z.object({
  assetId: z.uuid(),
  storageObjectId: z.uuid(),
  variantCode: z.string().min(1).max(64),
  container: z.string().max(32).optional(),
  codec: z.string().max(64).optional(),
  bitrateKbps: z.number().int().positive().optional(),
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
  sampleRateHz: z.number().int().positive().optional(),
  channelCount: z.number().int().positive().optional(),
  isSource: z.boolean().default(false),
  isOfflineAllowed: z.boolean().default(false),
});

const ListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const UploadCreateSchema = z.object({
  expectedSizeByte: z.number().int().min(0).optional(),
  expectedSha256Hex: Hex32.optional(),
});

const UploadCompleteSchema = StorageObjectCreateSchema.omit({statusCode: true});

const SourceAssetCreateSchema = AssetCreateSchema.omit({statusCode: true, metadata: true}).extend({
  storageObjectId: z.uuid(),
  variantCode: z.string().min(1).max(64).default("SOURCE"),
  container: z.string().max(32).optional(),
  codec: z.string().max(64).optional(),
  bitrateKbps: z.number().int().positive().optional(),
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
  sampleRateHz: z.number().int().positive().optional(),
  channelCount: z.number().int().positive().optional(),
});

const TranscodeJobCreateSchema = z.object({
  sourceAssetVariantId: z.uuid(),
  profileCode: z.string().min(1).max(64),
});

const TranscodeJobUpdateSchema = z.object({
  statusCode: z.enum(["QUEUED", "RUNNING", "FAILED", "CANCELLED"]),
  lastError: z.string().max(8000).nullable().optional(),
});

const TranscodeJobCompleteSchema = UploadCompleteSchema.extend({
  variantCode: z.string().min(1).max(64),
  container: z.string().max(32).optional(),
  codec: z.string().max(64).optional(),
  bitrateKbps: z.number().int().positive().optional(),
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
  sampleRateHz: z.number().int().positive().optional(),
  channelCount: z.number().int().positive().optional(),
  isOfflineAllowed: z.boolean().default(false),
});

export async function registerMediaRoutes(app: FastifyInstance) {
  app.get("/api/v1/media/assets", async () => {
    const result = await query(`
      SELECT asset."publicId"::TEXT AS "id", type."code" AS "type", status."code" AS "status",
             asset."title", asset."durationMs", asset."metadata"
      FROM media."tAsset" asset
      JOIN media."tAssetType" type ON type."id" = asset."assetTypeId"
      JOIN media."tAssetStatus" status ON status."id" = asset."assetStatusId"
      WHERE asset."retireDtm" IS NULL
      ORDER BY asset."createDtm" DESC
      LIMIT 100
    `);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/media/references", async (request) => {
    await requirePermission(request, "content.upload");
    const [providers, storageStatuses, assetTypes, assetStatuses, roles, uploadStatuses, transcodeStatuses, languages, territories] = await Promise.all([
      query(`SELECT "code", "name" FROM media."tStorageProvider" WHERE "isActive" = TRUE ORDER BY "name"`),
      query(`SELECT "code", "name" FROM media."tStorageObjectStatus" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM media."tAssetType" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM media."tAssetStatus" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM media."tContentAssetRole" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM media."tUploadStatus" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM media."tTranscodeJobStatus" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM core."tLanguage" WHERE "isActive" = TRUE ORDER BY "name"`),
      query(`SELECT "code", "name" FROM core."tTerritory" WHERE "isActive" = TRUE ORDER BY "name"`),
    ]);
    return {
      providers: providers.rows, storageStatuses: storageStatuses.rows, assetTypes: assetTypes.rows,
      assetStatuses: assetStatuses.rows, roles: roles.rows, uploadStatuses: uploadStatuses.rows,
      transcodeStatuses: transcodeStatuses.rows, languages: languages.rows, territories: territories.rows,
    };
  });

  app.get("/api/v1/admin/media/assets", async (request) => {
    await requirePermission(request, "content.upload");
    const {limit} = ListSchema.parse(request.query);
    const result = await query(`
      SELECT asset."publicId"::TEXT AS "id", type."code" AS "type", status."code" AS "status",
             language."code" AS "language", asset."title", asset."durationMs", asset."metadata",
             asset."createDtm", COUNT(variant."id")::INT AS "variantCount"
      FROM media."tAsset" asset
      JOIN media."tAssetType" type ON type."id" = asset."assetTypeId"
      JOIN media."tAssetStatus" status ON status."id" = asset."assetStatusId"
      LEFT JOIN core."tLanguage" language ON language."id" = asset."languageId"
      LEFT JOIN media."tAssetVariant" variant ON variant."assetId" = asset."id"
      WHERE asset."retireDtm" IS NULL
      GROUP BY asset."id", type."code", status."code", language."code"
      ORDER BY asset."createDtm" DESC LIMIT $1
    `, [limit]);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/media/storage-objects", async (request) => {
    await requirePermission(request, "content.upload");
    const {limit} = ListSchema.parse(request.query);
    const result = await query(`
      SELECT object."publicId"::TEXT AS "id", provider."code" AS "provider", status."code" AS "status",
             object."bucketName", object."objectKey", object."sizeByte"::TEXT AS "sizeByte",
             object."contentType", encode(object."sha256Digest", 'hex') AS "sha256Hex", object."createDtm"
      FROM media."tStorageObject" object
      JOIN media."tStorageProvider" provider ON provider."id" = object."storageProviderId"
      JOIN media."tStorageObjectStatus" status ON status."id" = object."storageObjectStatusId"
      ORDER BY object."createDtm" DESC LIMIT $1
    `, [limit]);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/media/asset-variants", async (request) => {
    await requirePermission(request, "content.upload");
    const {limit} = ListSchema.parse(request.query);
    const result = await query(`
      SELECT variant."publicId"::TEXT AS "id", asset."publicId"::TEXT AS "assetId", asset."title",
             object."publicId"::TEXT AS "storageObjectId", variant."variantCode", variant."container",
             variant."codec", variant."widthPx", variant."heightPx", variant."isSource", variant."createDtm"
      FROM media."tAssetVariant" variant
      JOIN media."tAsset" asset ON asset."id" = variant."assetId"
      JOIN media."tStorageObject" object ON object."id" = variant."storageObjectId"
      ORDER BY variant."createDtm" DESC LIMIT $1
    `, [limit]);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/media/uploads", async (request) => {
    await requirePermission(request, "content.upload");
    const {limit} = ListSchema.parse(request.query);
    const result = await query(`
      SELECT upload."publicId"::TEXT AS "id", status."code" AS "status",
             upload."expectedSizeByte"::TEXT AS "expectedSizeByte",
             encode(upload."expectedSha256Digest", 'hex') AS "expectedSha256Hex",
             object."publicId"::TEXT AS "storageObjectId", upload."createDtm", upload."expireDtm", upload."completeDtm"
      FROM media."tUpload" upload
      JOIN media."tUploadStatus" status ON status."id" = upload."uploadStatusId"
      LEFT JOIN media."tStorageObject" object ON object."id" = upload."storageObjectId"
      ORDER BY upload."createDtm" DESC LIMIT $1
    `, [limit]);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/media/transcode-jobs", async (request) => {
    await requirePermission(request, "content.upload");
    const {limit} = ListSchema.parse(request.query);
    const result = await query(`
      SELECT job."publicId"::TEXT AS "id", variant."publicId"::TEXT AS "sourceAssetVariantId",
             asset."title", status."code" AS "status", job."profileCode", job."attemptCount",
             job."createDtm", job."startDtm", job."finishDtm", job."lastError"
      FROM media."tTranscodeJob" job
      JOIN media."tAssetVariant" variant ON variant."id" = job."sourceAssetVariantId"
      JOIN media."tAsset" asset ON asset."id" = variant."assetId"
      JOIN media."tTranscodeJobStatus" status ON status."id" = job."transcodeJobStatusId"
      ORDER BY job."createDtm" DESC LIMIT $1
    `, [limit]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/media/uploads", async (request, reply) => {
    const actor = await requirePermission(request, "content.upload");
    const input = UploadCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO media."tUpload" ("accountId", "uploadStatusId", "expectedSizeByte", "expectedSha256Digest", "expireDtm")
      SELECT $1, status."id", $2, CASE WHEN $3::TEXT IS NULL THEN NULL ELSE decode($3, 'hex') END,
             CURRENT_TIMESTAMP + INTERVAL '2 hours'
      FROM media."tUploadStatus" status WHERE status."code" = 'CREATED'
      RETURNING "publicId"::TEXT AS "id"
    `, [actor.accountId, input.expectedSizeByte ?? null, input.expectedSha256Hex ?? null]);
    return reply.status(201).send(result.rows[0]);
  });

  app.patch("/api/v1/admin/media/uploads/:id/complete", async (request) => {
    await requirePermission(request, "content.upload");
    const {id} = z.object({id: z.uuid()}).parse(request.params);
    const input = UploadCompleteSchema.parse(request.body);
    return withTransaction(async (client) => {
      const object = await client.query<{id: string; internalId: string}>(`
        INSERT INTO media."tStorageObject" (
          "storageProviderId", "storageObjectStatusId", "bucketName", "objectKey", "versionId",
          "sizeByte", "contentType", "etag", "sha256Digest", "verifyDtm"
        )
        SELECT provider."id", status."id", $2, $3, $4, $5, $6, $7, decode($8, 'hex'), CURRENT_TIMESTAMP
        FROM media."tStorageProvider" provider
        JOIN media."tStorageObjectStatus" status ON status."code" = 'AVAILABLE'
        WHERE provider."code" = $1
        RETURNING "publicId"::TEXT AS "id", "id"::TEXT AS "internalId"
      `, [input.providerCode, input.bucketName, input.objectKey, input.versionId ?? null, input.sizeByte, input.contentType ?? null, input.etag ?? null, input.sha256Hex]);
      const row = object.rows[0];
      if (!row) throw new ApiError(400, "STORAGE_PROVIDER_NOT_FOUND", "Storage provider не найден");
      const upload = await client.query(`
        UPDATE media."tUpload" upload
        SET "uploadStatusId" = status."id", "storageObjectId" = $2, "completeDtm" = CURRENT_TIMESTAMP
        FROM media."tUploadStatus" status
        WHERE upload."publicId" = $1 AND upload."completeDtm" IS NULL AND status."code" = 'VERIFIED'
        RETURNING upload."publicId"
      `, [id, row.internalId]);
      if (!upload.rows[0]) throw new ApiError(409, "UPLOAD_NOT_OPEN", "Upload не найден или уже завершён");
      return {storageObjectId: row.id};
    });
  });

  app.post("/api/v1/admin/media/source-assets", async (request, reply) => {
    const actor = await requirePermission(request, "content.upload");
    const input = SourceAssetCreateSchema.parse(request.body);
    const result = await withTransaction(async (client) => {
      const asset = await client.query<{id: string; internalId: string}>(`
        INSERT INTO media."tAsset" (
          "assetTypeId", "assetStatusId", "languageId", "title", "durationMs", "createByAccountId"
        )
        SELECT type."id", status."id", language."id", $4, $5, $6
        FROM media."tAssetType" type
        JOIN media."tAssetStatus" status ON status."code" = 'PROCESSING'
        LEFT JOIN core."tLanguage" language ON language."code" = $3
        WHERE type."code" = $2
          AND EXISTS (SELECT 1 FROM media."tStorageObject" object WHERE object."publicId" = $1)
        RETURNING "publicId"::TEXT AS "id", "id"::TEXT AS "internalId"
      `, [input.storageObjectId, input.typeCode, input.languageCode ?? null, input.title ?? null, input.durationMs ?? null, actor.accountId]);
      const assetRow = asset.rows[0];
      if (!assetRow) throw new ApiError(404, "SOURCE_ASSET_REFERENCE_NOT_FOUND", "Storage object, тип или язык не найден");
      const variant = await client.query<{id: string}>(`
        INSERT INTO media."tAssetVariant" (
          "assetId", "storageObjectId", "variantCode", "container", "codec", "bitrateKbps",
          "widthPx", "heightPx", "sampleRateHz", "channelCount", "isSource"
        )
        SELECT $1, object."id", $3, $4, $5, $6, $7, $8, $9, $10, TRUE
        FROM media."tStorageObject" object WHERE object."publicId" = $2
        RETURNING "publicId"::TEXT AS "id"
      `, [assetRow.internalId, input.storageObjectId, input.variantCode, input.container ?? null, input.codec ?? null,
        input.bitrateKbps ?? null, input.widthPx ?? null, input.heightPx ?? null, input.sampleRateHz ?? null, input.channelCount ?? null]);
      return {assetId: assetRow.id, assetVariantId: variant.rows[0]!.id};
    });
    return reply.status(201).send(result);
  });

  app.post("/api/v1/admin/media/transcode-jobs", async (request, reply) => {
    await requirePermission(request, "content.upload");
    const input = TranscodeJobCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO media."tTranscodeJob" ("sourceAssetVariantId", "transcodeJobStatusId", "profileCode")
      SELECT variant."id", status."id", $2
      FROM media."tAssetVariant" variant
      JOIN media."tTranscodeJobStatus" status ON status."code" = 'QUEUED'
      WHERE variant."publicId" = $1 AND variant."isSource" = TRUE
      RETURNING "publicId"::TEXT AS "id"
    `, [input.sourceAssetVariantId, input.profileCode]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "SOURCE_VARIANT_NOT_FOUND", "Исходный вариант asset не найден");
    return reply.status(201).send(row);
  });

  app.patch("/api/v1/admin/media/transcode-jobs/:id", async (request) => {
    await requirePermission(request, "content.upload");
    const {id} = z.object({id: z.uuid()}).parse(request.params);
    const input = TranscodeJobUpdateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      UPDATE media."tTranscodeJob" job
      SET "transcodeJobStatusId" = status."id",
          "startDtm" = CASE
            WHEN $2 IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED') THEN COALESCE(job."startDtm", CURRENT_TIMESTAMP)
            ELSE job."startDtm"
          END,
          "finishDtm" = CASE WHEN $2 IN ('SUCCEEDED', 'FAILED', 'CANCELLED') THEN CURRENT_TIMESTAMP ELSE NULL END,
          "attemptCount" = CASE WHEN $2 = 'RUNNING' THEN job."attemptCount" + 1 ELSE job."attemptCount" END,
          "lastError" = $3
      FROM media."tTranscodeJobStatus" status
      WHERE job."publicId" = $1 AND status."code" = $2
      RETURNING job."publicId"::TEXT AS "id"
    `, [id, input.statusCode, input.lastError ?? null]);
    if (!result.rows[0]) throw new ApiError(404, "TRANSCODE_JOB_NOT_FOUND", "Задача обработки не найдена");
    return result.rows[0];
  });

  app.post("/api/v1/admin/media/transcode-jobs/:id/complete", async (request) => {
    await requirePermission(request, "content.upload");
    const {id} = z.object({id: z.uuid()}).parse(request.params);
    const input = TranscodeJobCompleteSchema.parse(request.body);
    return withTransaction(async (client) => {
      const job = await client.query<{assetId: string}>(`
        SELECT source."assetId"::TEXT AS "assetId"
        FROM media."tTranscodeJob" job
        JOIN media."tAssetVariant" source ON source."id" = job."sourceAssetVariantId"
        WHERE job."publicId" = $1 AND job."finishDtm" IS NULL
        FOR UPDATE OF job
      `, [id]);
      const jobRow = job.rows[0];
      if (!jobRow) throw new ApiError(409, "TRANSCODE_JOB_NOT_OPEN", "Задача не найдена или уже завершена");
      const object = await client.query<{id: string; internalId: string}>(`
        INSERT INTO media."tStorageObject" (
          "storageProviderId", "storageObjectStatusId", "bucketName", "objectKey", "versionId",
          "sizeByte", "contentType", "etag", "sha256Digest", "verifyDtm"
        )
        SELECT provider."id", status."id", $2, $3, $4, $5, $6, $7, decode($8, 'hex'), CURRENT_TIMESTAMP
        FROM media."tStorageProvider" provider
        JOIN media."tStorageObjectStatus" status ON status."code" = 'AVAILABLE'
        WHERE provider."code" = $1
        RETURNING "publicId"::TEXT AS "id", "id"::TEXT AS "internalId"
      `, [input.providerCode, input.bucketName, input.objectKey, input.versionId ?? null, input.sizeByte,
        input.contentType ?? null, input.etag ?? null, input.sha256Hex]);
      const objectRow = object.rows[0];
      if (!objectRow) throw new ApiError(400, "STORAGE_PROVIDER_NOT_FOUND", "Storage provider не найден");
      const variant = await client.query<{id: string}>(`
        INSERT INTO media."tAssetVariant" (
          "assetId", "storageObjectId", "variantCode", "container", "codec", "bitrateKbps",
          "widthPx", "heightPx", "sampleRateHz", "channelCount", "isOfflineAllowed"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING "publicId"::TEXT AS "id"
      `, [jobRow.assetId, objectRow.internalId, input.variantCode, input.container ?? null, input.codec ?? null,
        input.bitrateKbps ?? null, input.widthPx ?? null, input.heightPx ?? null, input.sampleRateHz ?? null,
        input.channelCount ?? null, input.isOfflineAllowed]);
      await client.query(`
        UPDATE media."tAsset" asset
        SET "assetStatusId" = status."id"
        FROM media."tAssetStatus" status
        WHERE asset."id" = $1 AND status."code" = 'READY'
      `, [jobRow.assetId]);
      await client.query(`
        UPDATE media."tTranscodeJob" job
        SET "transcodeJobStatusId" = status."id", "startDtm" = COALESCE(job."startDtm", CURRENT_TIMESTAMP),
            "finishDtm" = CURRENT_TIMESTAMP, "lastError" = NULL
        FROM media."tTranscodeJobStatus" status
        WHERE job."publicId" = $1 AND status."code" = 'SUCCEEDED'
      `, [id]);
      return {storageObjectId: objectRow.id, assetVariantId: variant.rows[0]!.id};
    });
  });

  app.post("/api/v1/admin/media/storage-objects", async (request, reply) => {
    await requirePermission(request, "content.upload");
    const input = StorageObjectCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO media."tStorageObject" (
        "storageProviderId", "storageObjectStatusId", "bucketName", "objectKey",
        "versionId", "sizeByte", "contentType", "etag", "sha256Digest"
      )
      SELECT provider."id", status."id", $3, $4, $5, $6, $7, $8, decode($9, 'hex')
      FROM media."tStorageProvider" provider
      JOIN media."tStorageObjectStatus" status ON status."code" = $2
      WHERE provider."code" = $1
      RETURNING "publicId"::TEXT AS "id"
    `, [input.providerCode, input.statusCode, input.bucketName, input.objectKey, input.versionId ?? null, input.sizeByte, input.contentType ?? null, input.etag ?? null, input.sha256Hex]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "MEDIA_REFERENCE_NOT_FOUND", "Provider или status не найден");
    return reply.status(201).send(row);
  });

  app.post("/api/v1/admin/media/assets", async (request, reply) => {
    const actor = await requirePermission(request, "content.upload");
    const input = AssetCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO media."tAsset" (
        "assetTypeId", "assetStatusId", "languageId", "title", "durationMs", "metadata", "createByAccountId"
      )
      SELECT type."id", status."id", language."id", $3, $4, $5::JSONB, $6
      FROM media."tAssetType" type
      JOIN media."tAssetStatus" status ON status."code" = $2
      LEFT JOIN core."tLanguage" language ON language."code" = $7
      WHERE type."code" = $1
      RETURNING "publicId"::TEXT AS "id"
    `, [input.typeCode, input.statusCode, input.title ?? null, input.durationMs ?? null, JSON.stringify(input.metadata), actor.accountId, input.languageCode ?? null]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "ASSET_REFERENCE_NOT_FOUND", "Тип, статус или язык asset не найден");
    return reply.status(201).send(row);
  });

  app.post("/api/v1/admin/media/asset-variants", async (request, reply) => {
    await requirePermission(request, "content.upload");
    const input = AssetVariantCreateSchema.parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO media."tAssetVariant" (
        "assetId", "storageObjectId", "variantCode", "container", "codec", "bitrateKbps",
        "widthPx", "heightPx", "sampleRateHz", "channelCount", "isSource", "isOfflineAllowed"
      )
      SELECT asset."id", storageObject."id", $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      FROM media."tAsset" asset
      JOIN media."tStorageObject" storageObject ON storageObject."publicId" = $2
      WHERE asset."publicId" = $1
      RETURNING "publicId"::TEXT AS "id"
    `, [
      input.assetId, input.storageObjectId, input.variantCode, input.container ?? null, input.codec ?? null,
      input.bitrateKbps ?? null, input.widthPx ?? null, input.heightPx ?? null, input.sampleRateHz ?? null,
      input.channelCount ?? null, input.isSource, input.isOfflineAllowed,
    ]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "ASSET_OR_OBJECT_NOT_FOUND", "Asset или storage object не найден");
    return reply.status(201).send(row);
  });

  app.post("/api/v1/admin/media/content-assets", async (request, reply) => {
    await requirePermission(request, "content.upload");
    const input = z.object({
      contentId: z.uuid(),
      assetId: z.uuid(),
      roleCode: z.string().min(1).max(32),
      territoryCode: z.string().max(8).optional(),
      isPrimary: z.boolean().default(false),
      ordinal: z.number().int().positive().optional(),
    }).parse(request.body);
    const content = await findContentId(input.contentId);
    const result = await query<{id: string}>(`
      INSERT INTO media."tContentAsset" ("contentId", "assetId", "contentAssetRoleId", "territoryId", "isPrimary", "ordinal")
      SELECT $1, asset."id", role."id", territory."id", $5, $6
      FROM media."tAsset" asset
      JOIN media."tContentAssetRole" role ON role."code" = $3
      LEFT JOIN core."tTerritory" territory ON territory."code" = $4
      WHERE asset."publicId" = $2
      ON CONFLICT ON CONSTRAINT "uqContentAsset"
      DO UPDATE SET "isPrimary" = EXCLUDED."isPrimary", "ordinal" = EXCLUDED."ordinal"
      RETURNING "id"
    `, [content.id, input.assetId, input.roleCode, input.territoryCode ?? null, input.isPrimary, input.ordinal ?? null]);
    if (!result.rows[0]) throw new ApiError(404, "CONTENT_ASSET_REFERENCE_NOT_FOUND", "Asset, role или territory не найден");
    return reply.status(201).send({ok: true});
  });
}
