import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction} from "../../core/database.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().min(1).max(200).optional(),
});

const ContributorCreateSchema = z.object({
  kindCode: z.string().trim().min(2).max(32).default("PERSON"),
  primaryName: z.string().trim().min(1).max(512),
  normalizedName: z.string().trim().min(1).max(512).optional(),
  description: z.string().trim().max(5000).optional(),
});

const ContentCreateSchema = z.object({
  typeCode: z.string().trim().min(2).max(32),
  statusCode: z.string().trim().min(2).max(32).default("ACTIVE"),
  originalTitle: z.string().trim().min(1).max(512),
  originalLanguageCode: z.string().trim().min(2).max(16).optional(),
  releaseDate: z.string().date().optional(),
  durationMs: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const PublicationCreateSchema = z.object({
  slug: z.string().trim().min(3).max(128),
  title: z.string().trim().min(1).max(512),
  summary: z.string().trim().max(5000).optional(),
  statusCode: z.string().trim().min(2).max(32).default("DRAFT"),
  contentIds: z.array(z.uuid()).default([]),
});

async function createResource(resourceTypeCode: string) {
  const result = await query<{id: string; publicId: string}>(`
    INSERT INTO core."tResource" ("resourceTypeId")
    SELECT "id" FROM core."tResourceType" WHERE "code" = $1
    RETURNING "id", "publicId"::TEXT AS "publicId"
  `, [resourceTypeCode]);
  const row = result.rows[0];
  if (!row) throw new ApiError(400, "RESOURCE_TYPE_NOT_FOUND", "Тип ресурса не найден");
  return row;
}

export async function registerContentRoutes(app: FastifyInstance) {
  app.get("/api/v1/content/types", async () => {
    const result = await query(`
      SELECT "code", "name", "isContainer", "isPlayable"
      FROM content."tContentType"
      WHERE "isActive" = TRUE
      ORDER BY "code"
    `);
    return {items: result.rows};
  });

  app.get("/api/v1/content/statuses", async () => {
    const result = await query(`
      SELECT "code", "name", "isPublic"
      FROM content."tContentStatus"
      ORDER BY "code"
    `);
    return {items: result.rows};
  });

  app.get("/api/v1/contributors", async (request) => {
    const filters = PaginationSchema.parse(request.query);
    const result = await query(`
      SELECT
        contributor."publicId"::TEXT AS "id",
        contributor."primaryName" AS "primaryName",
        contributor."normalizedName" AS "normalizedName",
        contributor."description",
        kind."code" AS "kind"
      FROM content."tContributor" contributor
      JOIN content."tContributorKind" kind ON kind."id" = contributor."contributorKindId"
      WHERE contributor."retireDtm" IS NULL
        AND ($3::TEXT IS NULL OR contributor."primaryName" ILIKE '%' || $3 || '%' OR contributor."normalizedName" ILIKE '%' || $3 || '%')
      ORDER BY contributor."primaryName"
      LIMIT $1 OFFSET $2
    `, [filters.limit, filters.offset, filters.q ?? null]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/contributors", async (request, reply) => {
    const actor = await requirePermission(request, "content.submit");
    const input = ContributorCreateSchema.parse(request.body);
    const resource = await createResource("contributor");
    const result = await query<{id: string}>(`
      INSERT INTO content."tContributor" (
        "resourceId", "contributorKindId", "primaryName", "normalizedName", "description", "createByAccountId"
      )
      SELECT $1, kind."id", $2, $3, $4, $5
      FROM content."tContributorKind" kind
      WHERE kind."code" = $6
      RETURNING "publicId"::TEXT AS "id"
    `, [
      resource.id,
      input.primaryName,
      input.normalizedName ?? input.primaryName.toLowerCase(),
      input.description ?? null,
      actor.accountId,
      input.kindCode,
    ]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "CONTRIBUTOR_KIND_NOT_FOUND", "Тип контрибьютора не найден");
    return reply.status(201).send(row);
  });

  app.get("/api/v1/content", async (request) => {
    const filters = PaginationSchema.parse(request.query);
    const result = await query(`
      SELECT
        contentItem."publicId"::TEXT AS "id",
        contentItem."originalTitle" AS "originalTitle",
        contentItem."releaseDt" AS "releaseDate",
        contentItem."durationMs",
        contentItem."metadata",
        contentType."code" AS "type",
        contentStatus."code" AS "status",
        resource."publicId"::TEXT AS "resourceId"
      FROM content."tContent" contentItem
      JOIN content."tContentType" contentType ON contentType."id" = contentItem."contentTypeId"
      JOIN content."tContentStatus" contentStatus ON contentStatus."id" = contentItem."contentStatusId"
      JOIN core."tResource" resource ON resource."id" = contentItem."resourceId"
      WHERE contentItem."retireDtm" IS NULL
        AND ($3::TEXT IS NULL OR contentItem."originalTitle" ILIKE '%' || $3 || '%')
      ORDER BY contentItem."createDtm" DESC
      LIMIT $1 OFFSET $2
    `, [filters.limit, filters.offset, filters.q ?? null]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/content", async (request, reply) => {
    const actor = await requirePermission(request, "content.submit");
    const input = ContentCreateSchema.parse(request.body);
    const resource = await createResource("content");
    const result = await query<{id: string; resourceId: string}>(`
      INSERT INTO content."tContent" (
        "resourceId", "contentTypeId", "contentStatusId", "originalLanguageId",
        "originalTitle", "releaseDt", "durationMs", "metadata", "createByAccountId"
      )
      SELECT
        $1, contentType."id", contentStatus."id", language."id",
        $2, $3, $4, $5::JSONB, $6
      FROM content."tContentType" contentType
      JOIN content."tContentStatus" contentStatus ON contentStatus."code" = $7
      LEFT JOIN core."tLanguage" language ON language."code" = $8
      WHERE contentType."code" = $9
      RETURNING "publicId"::TEXT AS "id", $10::TEXT AS "resourceId"
    `, [
      resource.id,
      input.originalTitle,
      input.releaseDate ?? null,
      input.durationMs ?? null,
      JSON.stringify(input.metadata),
      actor.accountId,
      input.statusCode,
      input.originalLanguageCode ?? null,
      input.typeCode,
      resource.publicId,
    ]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "CONTENT_REFERENCE_NOT_FOUND", "Тип, статус или язык контента не найден");
    return reply.status(201).send(row);
  });

  app.get("/api/v1/publications", async (request) => {
    const filters = PaginationSchema.parse(request.query);
    const result = await query(`
      SELECT
        publication."publicId"::TEXT AS "id",
        publication."slug"::TEXT AS "slug",
        publication."title",
        publication."summary",
        publicationStatus."code" AS "status",
        publication."publishDtm" AS "publishDtm"
      FROM content."tPublication" publication
      JOIN content."tPublicationStatus" publicationStatus ON publicationStatus."id" = publication."publicationStatusId"
      WHERE publication."retireDtm" IS NULL
        AND ($3::TEXT IS NULL OR publication."title" ILIKE '%' || $3 || '%' OR publication."slug"::TEXT ILIKE '%' || $3 || '%')
      ORDER BY publication."createDtm" DESC
      LIMIT $1 OFFSET $2
    `, [filters.limit, filters.offset, filters.q ?? null]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/publications", async (request, reply) => {
    const actor = await requirePermission(request, "content.submit");
    const input = PublicationCreateSchema.parse(request.body);
    const publication = await withTransaction(async (client) => {
      const resource = await client.query<{id: string; publicId: string}>(`
        INSERT INTO core."tResource" ("resourceTypeId")
        SELECT "id" FROM core."tResourceType" WHERE "code" = 'publication'
        RETURNING "id", "publicId"::TEXT AS "publicId"
      `);
      const resourceRow = resource.rows[0];
      if (!resourceRow) throw new ApiError(400, "RESOURCE_TYPE_NOT_FOUND", "Тип ресурса publication не найден");

      const created = await client.query<{id: string; internalId: string}>(`
        INSERT INTO content."tPublication" (
          "resourceId", "publicationStatusId", "slug", "title", "summary", "createByAccountId"
        )
        SELECT $1, status."id", $2, $3, $4, $5
        FROM content."tPublicationStatus" status
        WHERE status."code" = $6
        RETURNING "publicId"::TEXT AS "id", "id" AS "internalId"
      `, [resourceRow.id, input.slug, input.title, input.summary ?? null, actor.accountId, input.statusCode]);
      const createdRow = created.rows[0];
      if (!createdRow) throw new ApiError(400, "PUBLICATION_STATUS_NOT_FOUND", "Статус публикации не найден");

      for (const [index, contentPublicId] of input.contentIds.entries()) {
        await client.query(`
          INSERT INTO content."tPublicationContent" ("publicationId", "contentId", "ordinal", "isPrimary")
          SELECT $1, contentItem."id", $2, $3
          FROM content."tContent" contentItem
          WHERE contentItem."publicId" = $4
        `, [createdRow.internalId, index + 1, index === 0, contentPublicId]);
      }
      return {id: createdRow.id};
    });

    return reply.status(201).send(publication);
  });
}
