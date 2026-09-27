import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction} from "../../core/database.js";
import {findResourceId, writeAuditEvent} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requireAuth, requirePermission} from "../../core/http/auth-context.js";
import {sha256Buffer} from "../auth/auth.crypto.js";

const resourceLabel = `COALESCE(contentItem."originalTitle", publication."title", contributor."primaryName", collection."name", profile."displayName", resource."publicId"::TEXT)`;

export async function registerLegalRoutes(app: FastifyInstance) {
  app.get("/api/v1/legal/policies", async () => {
    const result = await query(`
      SELECT document."code", document."name", document."isRequiredForRegistration",
             version."publicId"::TEXT AS "currentVersionId", version."versionCode", version."effectiveDtm"
      FROM legal."tPolicyDocument" document
      LEFT JOIN LATERAL (
        SELECT * FROM legal."tPolicyVersion" version
        WHERE version."policyDocumentId" = document."id"
          AND version."effectiveDtm" <= CURRENT_TIMESTAMP AND version."retireDtm" IS NULL
        ORDER BY version."effectiveDtm" DESC LIMIT 1
      ) version ON TRUE ORDER BY document."code"
    `);
    return {items: result.rows};
  });

  app.post("/api/v1/legal/policies/:versionId/accept", async (request) => {
    const context = await requireAuth(request);
    const params = z.object({versionId: z.uuid()}).parse(request.params);
    const result = await query(`
      INSERT INTO legal."tAccountPolicyAcceptance" ("accountId", "policyVersionId")
      SELECT $1, "id" FROM legal."tPolicyVersion" WHERE "publicId" = $2
      ON CONFLICT ("accountId", "policyVersionId") DO UPDATE SET "withdrawDtm" = NULL
    `, [context.accountId, params.versionId]);
    if (result.rowCount === 0) throw new ApiError(404, "POLICY_VERSION_NOT_FOUND", "Версия документа не найдена");
    return {ok: true};
  });

  app.get("/api/v1/admin/legal/references", async (request) => {
    await requirePermission(request, "legal.complaint.resolve");
    const [statuses, documents, licenseTypes, territories, languages, contributors, resources, reports, storageObjects] = await Promise.all([
      query(`SELECT "code", "name", "allowsPublication" FROM legal."tLegalStatus" ORDER BY "name"`),
      query(`SELECT "code", "name", "isRequiredForRegistration" FROM legal."tPolicyDocument" ORDER BY "name"`),
      query(`SELECT "code", "name" FROM legal."tLicenseType" ORDER BY "name"`),
      query(`SELECT "code", "name" FROM core."tTerritory" WHERE "isActive" = TRUE ORDER BY CASE WHEN "code" = 'WORLD' THEN 0 ELSE 1 END, "name"`),
      query(`SELECT "code", "name" FROM core."tLanguage" WHERE "isActive" = TRUE ORDER BY "name"`),
      query(`SELECT "publicId"::TEXT AS "id", "primaryName" AS "name" FROM content."tContributor" WHERE "retireDtm" IS NULL ORDER BY "primaryName" LIMIT 300`),
      query(`
        SELECT resource."publicId"::TEXT AS "id", type."code" AS "type", ${resourceLabel} AS "name"
        FROM core."tResource" resource JOIN core."tResourceType" type ON type."id" = resource."resourceTypeId"
        LEFT JOIN content."tContent" contentItem ON contentItem."resourceId" = resource."id" AND contentItem."retireDtm" IS NULL
        LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id" AND publication."retireDtm" IS NULL
        LEFT JOIN content."tContributor" contributor ON contributor."resourceId" = resource."id" AND contributor."retireDtm" IS NULL
        LEFT JOIN library."tCollection" collection ON collection."resourceId" = resource."id" AND collection."deleteDtm" IS NULL
        LEFT JOIN account."tProfile" profile ON profile."resourceId" = resource."id"
        WHERE resource."deleteDtm" IS NULL ORDER BY "name" LIMIT 500
      `),
      query(`SELECT "publicId"::TEXT AS "id", "reasonCode" AS "name" FROM moderation."tReport" ORDER BY "createDtm" DESC LIMIT 200`),
      query(`SELECT "publicId"::TEXT AS "id", "objectKey" AS "name" FROM media."tStorageObject" WHERE "deleteDtm" IS NULL ORDER BY "createDtm" DESC LIMIT 300`),
    ]);
    return {statuses: statuses.rows, documents: documents.rows, licenseTypes: licenseTypes.rows, territories: territories.rows, languages: languages.rows, contributors: contributors.rows, resources: resources.rows, reports: reports.rows, storageObjects: storageObjects.rows};
  });

  app.get("/api/v1/admin/legal/statuses", async (request) => {
    await requirePermission(request, "legal.complaint.resolve");
    const result = await query(`SELECT "code", "name", "allowsPublication" FROM legal."tLegalStatus" ORDER BY "code"`);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/legal/resource-statuses", async (request) => {
    await requirePermission(request, "legal.complaint.resolve");
    const filters = z.object({q: z.string().optional(), active: z.enum(["all", "active", "revoked"]).default("all")}).parse(request.query);
    const result = await query(`
      SELECT statusEntry."id"::TEXT AS "id", resource."publicId"::TEXT AS "resourceId", type."code" AS "resourceType", ${resourceLabel} AS "resourceName",
             legalStatus."code" AS "status", legalStatus."name" AS "statusName", legalStatus."allowsPublication",
             territory."code" AS "territory", territory."name" AS "territoryName", statusEntry."sourceType", statusEntry."evidence",
             statusEntry."validFromDtm", statusEntry."validUntilDtm", statusEntry."revokeDtm"
      FROM legal."tResourceLegalStatus" statusEntry
      JOIN core."tResource" resource ON resource."id" = statusEntry."resourceId"
      JOIN core."tResourceType" type ON type."id" = resource."resourceTypeId"
      JOIN legal."tLegalStatus" legalStatus ON legalStatus."id" = statusEntry."legalStatusId"
      JOIN core."tTerritory" territory ON territory."id" = statusEntry."territoryId"
      LEFT JOIN content."tContent" contentItem ON contentItem."resourceId" = resource."id"
      LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id"
      LEFT JOIN content."tContributor" contributor ON contributor."resourceId" = resource."id"
      LEFT JOIN library."tCollection" collection ON collection."resourceId" = resource."id"
      LEFT JOIN account."tProfile" profile ON profile."resourceId" = resource."id"
      WHERE ($1::TEXT IS NULL OR ${resourceLabel} ILIKE '%' || $1 || '%')
        AND ($2 = 'all' OR ($2 = 'active' AND statusEntry."revokeDtm" IS NULL) OR ($2 = 'revoked' AND statusEntry."revokeDtm" IS NOT NULL))
      ORDER BY statusEntry."validFromDtm" DESC LIMIT 300
    `, [filters.q || null, filters.active]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/legal/resource-statuses", async (request, reply) => {
    const context = await requirePermission(request, "legal.complaint.resolve");
    const input = z.object({resourceId: z.uuid(), legalStatusCode: z.string().min(1).max(32), territoryCode: z.string().default("WORLD"), sourceType: z.enum(["UPLOADER_DECLARATION", "LICENSE", "PUBLIC_DOMAIN", "RIGHTS_HOLDER", "COMPLAINT_DECISION", "LEGAL_REVIEW"]), evidence: z.record(z.string(), z.unknown()).default({}), validUntilDtm: z.string().datetime().optional()}).parse(request.body);
    const resourceId = await findResourceId(input.resourceId);
    const row = await withTransaction(async (client) => {
      // The data-modifying CTE replaces one territorial status atomically.
      const result = await client.query<{id: string}>(`
        WITH selected_status AS (SELECT "id" FROM legal."tLegalStatus" WHERE "code" = $2),
             selected_territory AS (SELECT "id" FROM core."tTerritory" WHERE "code" = $3),
             revoked AS (UPDATE legal."tResourceLegalStatus" SET "revokeDtm" = CURRENT_TIMESTAMP WHERE "resourceId" = $1 AND "territoryId" = (SELECT "id" FROM selected_territory) AND "revokeDtm" IS NULL)
        INSERT INTO legal."tResourceLegalStatus" ("resourceId", "legalStatusId", "territoryId", "sourceType", "declaredByAccountId", "evidence", "validUntilDtm")
        SELECT $1, selected_status."id", selected_territory."id", $4, $5, $6::JSONB, $7 FROM selected_status CROSS JOIN selected_territory
        RETURNING "id"::TEXT AS "id"
      `, [resourceId, input.legalStatusCode, input.territoryCode, input.sourceType, context.accountId, JSON.stringify(input.evidence), input.validUntilDtm ?? null]);
      if (!result.rows[0]) throw new ApiError(400, "LEGAL_REFERENCE_NOT_FOUND", "Правовой статус или территория не найдены");
      await writeAuditEvent({categoryCode: "LEGAL", serviceCode: "legal", actionCode: "legal.resource_status.changed", actorAccountId: context.accountId, actorSessionId: context.sessionId, targetResourceId: resourceId, details: {status: input.legalStatusCode, territory: input.territoryCode}}, client);
      return result.rows[0];
    });
    return reply.status(201).send(row);
  });

  app.get("/api/v1/admin/legal/licenses", async (request) => {
    await requirePermission(request, "legal.complaint.resolve");
    const result = await query(`
      SELECT license."publicId"::TEXT AS "id", resource."publicId"::TEXT AS "resourceId",
             COALESCE(contentItem."originalTitle", publication."title", resource."publicId"::TEXT) AS "resourceName",
             type."code" AS "type", type."name" AS "typeName", contributor."primaryName" AS "rightsHolder",
             license."licenseReference", license."validFromDt", license."validUntilDt", license."createDtm", license."revokeDtm",
             COALESCE(array_agg(territory."code") FILTER (WHERE territory."code" IS NOT NULL), '{}') AS "territories"
      FROM legal."tLicense" license JOIN core."tResource" resource ON resource."id" = license."resourceId"
      JOIN legal."tLicenseType" type ON type."id" = license."licenseTypeId"
      LEFT JOIN content."tContent" contentItem ON contentItem."resourceId" = resource."id"
      LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id"
      LEFT JOIN content."tContributor" contributor ON contributor."id" = license."rightsHolderContributorId"
      LEFT JOIN legal."tLicenseTerritory" licenseTerritory ON licenseTerritory."licenseId" = license."id"
      LEFT JOIN core."tTerritory" territory ON territory."id" = licenseTerritory."territoryId"
      GROUP BY license."id", resource."publicId", contentItem."originalTitle", publication."title", type."code", type."name", contributor."primaryName"
      ORDER BY license."createDtm" DESC LIMIT 300
    `);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/legal/licenses", async (request, reply) => {
    const context = await requirePermission(request, "legal.complaint.resolve");
    const input = z.object({resourceId: z.uuid(), licenseTypeCode: z.string().min(1), rightsHolderContributorId: z.uuid().optional(), evidenceStorageObjectId: z.uuid().optional(), licenseReference: z.string().max(512).optional(), territoryCodes: z.array(z.string()).min(1).default(["WORLD"]), validFromDt: z.string().date().optional(), validUntilDt: z.string().date().optional()}).parse(request.body);
    const resourceId = await findResourceId(input.resourceId);
    const row = await withTransaction(async (client) => {
      const result = await client.query<{id: string; internalId: string}>(`
        INSERT INTO legal."tLicense" ("resourceId", "licenseTypeId", "rightsHolderContributorId", "evidenceStorageObjectId", "licenseReference", "validFromDt", "validUntilDt")
        SELECT $1, type."id", contributor."id", evidenceObject."id", $5, $6, $7 FROM legal."tLicenseType" type
        LEFT JOIN content."tContributor" contributor ON contributor."publicId" = $3
        LEFT JOIN media."tStorageObject" evidenceObject ON evidenceObject."publicId" = $4 AND evidenceObject."deleteDtm" IS NULL
        WHERE type."code" = $2 AND ($3::UUID IS NULL OR contributor."id" IS NOT NULL) AND ($4::UUID IS NULL OR evidenceObject."id" IS NOT NULL)
        RETURNING "publicId"::TEXT AS "id", "id"::TEXT AS "internalId"
      `, [resourceId, input.licenseTypeCode, input.rightsHolderContributorId ?? null, input.evidenceStorageObjectId ?? null, input.licenseReference ?? null, input.validFromDt ?? null, input.validUntilDt ?? null]);
      const created = result.rows[0];
      if (!created) throw new ApiError(400, "LICENSE_REFERENCE_NOT_FOUND", "Тип лицензии или правообладатель не найден");
      const territories = await client.query(`INSERT INTO legal."tLicenseTerritory" ("licenseId", "territoryId") SELECT $1, "id" FROM core."tTerritory" WHERE "code" = ANY($2::TEXT[])`, [created.internalId, input.territoryCodes]);
      if (territories.rowCount !== input.territoryCodes.length) throw new ApiError(400, "TERRITORY_NOT_FOUND", "Одна из территорий не найдена");
      await writeAuditEvent({categoryCode: "LEGAL", serviceCode: "legal", actionCode: "legal.license.created", actorAccountId: context.accountId, actorSessionId: context.sessionId, targetResourceId: resourceId, details: {licenseId: created.id, type: input.licenseTypeCode}}, client);
      return {id: created.id};
    });
    return reply.status(201).send(row);
  });

  app.patch("/api/v1/admin/legal/licenses/:id/revoke", async (request) => {
    const context = await requirePermission(request, "legal.complaint.resolve");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query<{resourceId: string}>(`UPDATE legal."tLicense" SET "revokeDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1 AND "revokeDtm" IS NULL RETURNING "resourceId"::TEXT AS "resourceId"`, [params.id]);
    if (!result.rows[0]) throw new ApiError(404, "LICENSE_NOT_FOUND", "Активная лицензия не найдена");
    await writeAuditEvent({categoryCode: "LEGAL", serviceCode: "legal", actionCode: "legal.license.revoked", actorAccountId: context.accountId, actorSessionId: context.sessionId, targetResourceId: result.rows[0].resourceId, details: {licenseId: params.id}});
    return {ok: true};
  });

  app.get("/api/v1/admin/legal/takedowns", async (request) => {
    await requirePermission(request, "legal.complaint.resolve");
    const result = await query(`
      SELECT takedown."publicId"::TEXT AS "id", resource."publicId"::TEXT AS "resourceId",
             COALESCE(contentItem."originalTitle", publication."title", resource."publicId"::TEXT) AS "resourceName",
             territory."code" AS "territory", takedown."reasonCode", report."publicId"::TEXT AS "sourceReportId",
             takedown."effectiveDtm", takedown."expireDtm", takedown."revokeDtm"
      FROM legal."tTakedown" takedown JOIN core."tResource" resource ON resource."id" = takedown."resourceId"
      JOIN core."tTerritory" territory ON territory."id" = takedown."territoryId"
      LEFT JOIN content."tContent" contentItem ON contentItem."resourceId" = resource."id"
      LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id"
      LEFT JOIN moderation."tReport" report ON report."id" = takedown."sourceReportId"
      ORDER BY takedown."effectiveDtm" DESC LIMIT 300
    `);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/legal/takedowns", async (request, reply) => {
    const context = await requirePermission(request, "legal.complaint.resolve");
    const input = z.object({resourceId: z.uuid(), sourceReportId: z.uuid().optional(), territoryCode: z.string().default("WORLD"), reasonCode: z.string().min(1).max(64), effectiveDtm: z.string().datetime().optional(), expireDtm: z.string().datetime().optional()}).parse(request.body);
    const resourceId = await findResourceId(input.resourceId);
    const row = await withTransaction(async (client) => {
      const result = await client.query<{id: string}>(`
        WITH takedown AS (
          INSERT INTO legal."tTakedown" ("resourceId", "sourceReportId", "territoryId", "reasonCode", "effectiveDtm", "expireDtm")
          SELECT $1, report."id", territory."id", $4, COALESCE($5, CURRENT_TIMESTAMP), $6
          FROM core."tTerritory" territory LEFT JOIN moderation."tReport" report ON report."publicId" = $2
          WHERE territory."code" = $3 AND ($2::UUID IS NULL OR report."id" IS NOT NULL)
          RETURNING "publicId", "resourceId"
        ), taken_down_status AS (
          SELECT "id" FROM content."tPublicationStatus" WHERE "code" = 'TAKEN_DOWN'
        ), retired_publications AS (
          UPDATE content."tPublication" publication
          SET "publicationStatusId" = taken_down_status."id", "retireDtm" = CURRENT_TIMESTAMP, "updateDtm" = CURRENT_TIMESTAMP
          FROM takedown, taken_down_status, content."tPublicationContent" publicationContent, content."tContent" contentItem
          WHERE publication."id" = publicationContent."publicationId" AND contentItem."id" = publicationContent."contentId"
            AND contentItem."resourceId" = takedown."resourceId"
        )
        SELECT "publicId"::TEXT AS "id" FROM takedown
      `, [resourceId, input.sourceReportId ?? null, input.territoryCode, input.reasonCode, input.effectiveDtm ?? null, input.expireDtm ?? null]);
      if (!result.rows[0]) throw new ApiError(400, "TAKEDOWN_REFERENCE_NOT_FOUND", "Территория или жалоба не найдены");
      await writeAuditEvent({categoryCode: "LEGAL", serviceCode: "legal", actionCode: "legal.takedown.created", actorAccountId: context.accountId, actorSessionId: context.sessionId, targetResourceId: resourceId, details: {takedownId: result.rows[0].id, reason: input.reasonCode}}, client);
      return result.rows[0];
    });
    return reply.status(201).send(row);
  });

  app.patch("/api/v1/admin/legal/takedowns/:id/revoke", async (request) => {
    const context = await requirePermission(request, "legal.complaint.resolve");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query<{resourceId: string}>(`UPDATE legal."tTakedown" SET "revokeDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1 AND "revokeDtm" IS NULL RETURNING "resourceId"::TEXT AS "resourceId"`, [params.id]);
    if (!result.rows[0]) throw new ApiError(404, "TAKEDOWN_NOT_FOUND", "Активное требование не найдено");
    await writeAuditEvent({categoryCode: "LEGAL", serviceCode: "legal", actionCode: "legal.takedown.revoked", actorAccountId: context.accountId, actorSessionId: context.sessionId, targetResourceId: result.rows[0].resourceId, details: {takedownId: params.id}});
    return {ok: true};
  });

  app.get("/api/v1/admin/legal/policy-versions", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`
      SELECT version."publicId"::TEXT AS "id", document."code" AS "documentCode", document."name" AS "documentName",
             version."versionCode", language."code" AS "language", version."effectiveDtm", version."retireDtm", version."createDtm",
             COUNT(acceptance."id") FILTER (WHERE acceptance."withdrawDtm" IS NULL)::INTEGER AS "acceptanceCount"
      FROM legal."tPolicyVersion" version JOIN legal."tPolicyDocument" document ON document."id" = version."policyDocumentId"
      JOIN core."tLanguage" language ON language."id" = version."languageId"
      LEFT JOIN legal."tAccountPolicyAcceptance" acceptance ON acceptance."policyVersionId" = version."id"
      GROUP BY version."id", document."code", document."name", language."code" ORDER BY version."effectiveDtm" DESC
    `);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/legal/policy-versions", async (request, reply) => {
    const context = await requirePermission(request, "platform.admin");
    const input = z.object({documentCode: z.string().min(1).max(64), versionCode: z.string().min(1).max(32), languageCode: z.string().min(2).max(16).default("ru"), content: z.string().min(1), effectiveDtm: z.string().datetime()}).parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO legal."tPolicyVersion" ("policyDocumentId", "versionCode", "languageId", "contentDigest", "effectiveDtm")
      SELECT document."id", $2, language."id", $4, $5 FROM legal."tPolicyDocument" document
      JOIN core."tLanguage" language ON language."code" = $3 WHERE document."code" = $1
      RETURNING "publicId"::TEXT AS "id"
    `, [input.documentCode, input.versionCode, input.languageCode, sha256Buffer(input.content), input.effectiveDtm]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "POLICY_REFERENCE_NOT_FOUND", "Документ или язык не найдены");
    await writeAuditEvent({categoryCode: "LEGAL", serviceCode: "legal", actionCode: "legal.policy_version.created", actorAccountId: context.accountId, actorSessionId: context.sessionId, details: {policyVersionId: row.id, document: input.documentCode}});
    return reply.status(201).send(row);
  });
}
