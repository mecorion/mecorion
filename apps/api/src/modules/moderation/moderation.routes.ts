import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction, type DatabaseClient} from "../../core/database.js";
import {findResourceId} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requireAuth, requirePermission} from "../../core/http/auth-context.js";

const ReportTransitions: Record<string, string[]> = {
  OPEN: ["TRIAGE", "REJECTED", "DUPLICATE"],
  TRIAGE: ["INVESTIGATING", "RESOLVED", "REJECTED", "DUPLICATE"],
  INVESTIGATING: ["RESOLVED", "REJECTED", "DUPLICATE"],
};
const RestrictionTransitions: Record<string, string[]> = {
  PENDING: ["ACTIVE", "REVOKED"], ACTIVE: ["SUSPENDED", "EXPIRED", "REVOKED"],
  SUSPENDED: ["ACTIVE", "EXPIRED", "REVOKED"],
};
const AppealTransitions: Record<string, string[]> = {
  SUBMITTED: ["REVIEWING", "UPHELD", "OVERTURNED", "CANCELLED"],
  REVIEWING: ["UPHELD", "OVERTURNED", "CANCELLED"],
};

async function currentCode(table: string, statusTable: string, statusIdColumn: string, publicId: string, client: DatabaseClient) {
  const result = await client.query<{id: string; status: string}>(`
    SELECT entity."id"::TEXT AS "id", status."code" AS "status"
    FROM ${table} entity JOIN ${statusTable} status ON status."id" = entity."${statusIdColumn}"
    WHERE entity."publicId" = $1 FOR UPDATE OF entity
  `, [publicId]);
  return result.rows[0];
}

export async function registerModerationRoutes(app: FastifyInstance) {
  app.get("/api/v1/moderation/report-reasons", async () => {
    const result = await query(`SELECT "code", "name" FROM moderation."tReportReason" WHERE "isActive" = TRUE ORDER BY "code"`);
    return {items: result.rows};
  });

  app.post("/api/v1/moderation/reports", async (request, reply) => {
    const context = await requirePermission(request, "moderation.report.create");
    const input = z.object({
      resourceId: z.uuid(), reasonCode: z.string().min(1).max(64),
      description: z.string().max(5000).optional(), evidence: z.record(z.string(), z.unknown()).default({}),
    }).parse(request.body);
    const resourceId = await findResourceId(input.resourceId);
    const result = await query<{id: string}>(`
      INSERT INTO moderation."tReport" ("resourceId", "reportByAccountId", "reportReasonId", "reportStatusId", "description", "evidence")
      SELECT $1, $2, reason."id", status."id", $4, $5::JSONB
      FROM moderation."tReportReason" reason CROSS JOIN moderation."tReportStatus" status
      WHERE reason."code" = $3 AND reason."isActive" = TRUE AND status."code" = 'OPEN'
      RETURNING "publicId"::TEXT AS "id"
    `, [resourceId, context.accountId, input.reasonCode, input.description ?? null, JSON.stringify(input.evidence)]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "REPORT_REFERENCE_NOT_FOUND", "Причина жалобы не найдена");
    return reply.status(201).send(row);
  });

  app.post("/api/v1/moderation/restrictions/:restrictionId/appeals", async (request, reply) => {
    const context = await requireAuth(request);
    const {restrictionId} = z.object({restrictionId: z.uuid()}).parse(request.params);
    const input = z.object({statement: z.string().trim().min(1).max(10000)}).parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO moderation."tAppeal" ("restrictionId", "appealStatusId", "accountId", "statement")
      SELECT restriction."id", status."id", $2, $3
      FROM moderation."tRestriction" restriction
      JOIN moderation."tRestrictionStatus" restrictionStatus ON restrictionStatus."id" = restriction."restrictionStatusId"
      CROSS JOIN moderation."tAppealStatus" status
      WHERE restriction."publicId" = $1 AND restriction."accountId" = $2
        AND restriction."revokeDtm" IS NULL AND restrictionStatus."isEffective" = TRUE
        AND (restriction."validUntilDtm" IS NULL OR restriction."validUntilDtm" > CURRENT_TIMESTAMP)
        AND status."code" = 'SUBMITTED'
      RETURNING "publicId"::TEXT AS "id"
    `, [restrictionId, context.accountId, input.statement]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "RESTRICTION_NOT_FOUND", "Активное ограничение не найдено");
    return reply.status(201).send(row);
  });

  app.get("/api/v1/admin/moderation/references", async (request) => {
    await requirePermission(request, "moderation.report.review");
    const [reasons, reportStatuses, restrictionStatuses, appealStatuses, scopes, permissions] = await Promise.all([
      query(`SELECT "code", "name" FROM moderation."tReportReason" WHERE "isActive" = TRUE ORDER BY "name"`),
      query(`SELECT "code", "name", "isFinal" FROM moderation."tReportStatus" ORDER BY "id"`),
      query(`SELECT "code", "name", "isEffective" FROM moderation."tRestrictionStatus" ORDER BY "id"`),
      query(`SELECT "code", "name", "isFinal" FROM moderation."tAppealStatus" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM access."tScope" WHERE "isActive" = TRUE AND "code" IS NOT NULL ORDER BY "name"`),
      query(`SELECT "code", "name" FROM access."tPermission" WHERE "isActive" = TRUE ORDER BY "code"`),
    ]);
    return {reasons: reasons.rows, reportStatuses: reportStatuses.rows, restrictionStatuses: restrictionStatuses.rows, appealStatuses: appealStatuses.rows, scopes: scopes.rows, permissions: permissions.rows};
  });

  app.get("/api/v1/admin/moderation/reports", async (request) => {
    await requirePermission(request, "moderation.report.review");
    const filters = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100), status: z.string().max(32).optional(),
      reason: z.string().max(64).optional(), q: z.string().trim().max(200).optional(),
    }).parse(request.query);
    const result = await query(`
      SELECT report."publicId"::TEXT AS "id", reason."code" AS "reason", reason."name" AS "reasonName",
             status."code" AS "status", status."name" AS "statusName", report."description", report."evidence",
             reporterAccount."publicId"::TEXT AS "reporterAccountId", reporter."displayName" AS "reportedBy",
             resource."publicId"::TEXT AS "resourceId", resourceType."code" AS "resourceType",
             COALESCE(targetProfile."displayName", content."originalTitle", contributor."primaryName", publication."title", resource."publicId"::TEXT) AS "targetName",
             targetAccount."publicId"::TEXT AS "targetAccountId", report."createDtm", report."closeDtm"
      FROM moderation."tReport" report
      JOIN moderation."tReportReason" reason ON reason."id" = report."reportReasonId"
      JOIN moderation."tReportStatus" status ON status."id" = report."reportStatusId"
      JOIN core."tResource" resource ON resource."id" = report."resourceId"
      JOIN core."tResourceType" resourceType ON resourceType."id" = resource."resourceTypeId"
      LEFT JOIN account."tAccount" reporterAccount ON reporterAccount."id" = report."reportByAccountId"
      LEFT JOIN account."tProfile" reporter ON reporter."accountId" = report."reportByAccountId"
      LEFT JOIN account."tProfile" targetProfile ON targetProfile."resourceId" = resource."id"
      LEFT JOIN account."tAccount" targetAccount ON targetAccount."id" = targetProfile."accountId"
      LEFT JOIN content."tContent" content ON content."resourceId" = resource."id"
      LEFT JOIN content."tContributor" contributor ON contributor."resourceId" = resource."id"
      LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id"
      WHERE ($1::TEXT IS NULL OR status."code" = $1) AND ($2::TEXT IS NULL OR reason."code" = $2)
        AND ($3::TEXT IS NULL OR report."description" ILIKE '%' || $3 || '%' OR reporter."displayName" ILIKE '%' || $3 || '%'
          OR targetProfile."displayName" ILIKE '%' || $3 || '%' OR content."originalTitle" ILIKE '%' || $3 || '%'
          OR contributor."primaryName" ILIKE '%' || $3 || '%' OR publication."title" ILIKE '%' || $3 || '%')
      ORDER BY report."createDtm" DESC LIMIT $4
    `, [filters.status ?? null, filters.reason ?? null, filters.q || null, filters.limit]);
    return {items: result.rows};
  });

  app.patch("/api/v1/admin/moderation/reports/:reportId/status", async (request) => {
    await requirePermission(request, "moderation.report.review");
    const {reportId} = z.object({reportId: z.uuid()}).parse(request.params);
    const input = z.object({statusCode: z.string().min(1).max(32), resolutionNote: z.string().max(5000).optional()}).parse(request.body);
    await withTransaction(async (client) => {
      const current = await currentCode(`moderation."tReport"`, `moderation."tReportStatus"`, "reportStatusId", reportId, client);
      if (!current) throw new ApiError(404, "REPORT_NOT_FOUND", "Жалоба не найдена");
      if (!ReportTransitions[current.status]?.includes(input.statusCode)) throw new ApiError(409, "INVALID_REPORT_TRANSITION", `Переход ${current.status} → ${input.statusCode} запрещён`);
      const updated = await client.query(`
        UPDATE moderation."tReport" report SET "reportStatusId" = status."id",
          "closeDtm" = CASE WHEN status."isFinal" THEN CURRENT_TIMESTAMP ELSE NULL END,
          "evidence" = report."evidence" || jsonb_build_object('resolutionNote', $3::TEXT)
        FROM moderation."tReportStatus" status
        WHERE report."id" = $1 AND status."code" = $2 RETURNING report."id"
      `, [current.id, input.statusCode, input.resolutionNote ?? null]);
      if (!updated.rows[0]) throw new ApiError(400, "REPORT_STATUS_NOT_FOUND", "Статус жалобы не найден");
    });
    return {ok: true};
  });

  app.get("/api/v1/admin/moderation/restrictions", async (request) => {
    await requirePermission(request, "moderation.restriction.manage");
    const filters = z.object({limit: z.coerce.number().int().min(1).max(200).default(100), status: z.string().max(32).optional(), q: z.string().trim().max(200).optional()}).parse(request.query);
    const result = await query(`
      SELECT restriction."publicId"::TEXT AS "id", account."publicId"::TEXT AS "accountId", profile."displayName",
             scope."code" AS "scope", permission."code" AS "permission", status."code" AS "status", status."name" AS "statusName",
             restriction."sourceType", report."publicId"::TEXT AS "sourceReportId", restriction."reasonCode", restriction."details",
             restriction."validFromDtm", restriction."validUntilDtm", restriction."revokeDtm", restriction."createDtm"
      FROM moderation."tRestriction" restriction
      JOIN account."tAccount" account ON account."id" = restriction."accountId"
      JOIN account."tProfile" profile ON profile."accountId" = account."id"
      JOIN access."tScope" scope ON scope."id" = restriction."scopeId"
      JOIN moderation."tRestrictionStatus" status ON status."id" = restriction."restrictionStatusId"
      LEFT JOIN access."tPermission" permission ON permission."id" = restriction."permissionId"
      LEFT JOIN moderation."tReport" report ON report."id" = restriction."sourceReportId"
      WHERE ($1::TEXT IS NULL OR status."code" = $1)
        AND ($2::TEXT IS NULL OR profile."displayName" ILIKE '%' || $2 || '%' OR restriction."reasonCode" ILIKE '%' || $2 || '%')
      ORDER BY restriction."createDtm" DESC LIMIT $3
    `, [filters.status ?? null, filters.q || null, filters.limit]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/moderation/restrictions", async (request, reply) => {
    const context = await requirePermission(request, "moderation.restriction.manage");
    const input = z.object({
      accountId: z.uuid(), scopeCode: z.string().default("global"), permissionCode: z.string().optional(),
      statusCode: z.enum(["PENDING", "ACTIVE"]).default("ACTIVE"),
      sourceType: z.enum(["AUTOMATIC", "COMMUNITY", "COMPLAINT", "SECURITY", "LEGAL"]).default("COMMUNITY"),
      sourceReportId: z.uuid().optional(), reasonCode: z.string().min(1).max(64),
      details: z.string().max(5000).optional(), validUntilDtm: z.string().datetime().optional(),
    }).superRefine((value, context) => {
      if (value.sourceType === "COMPLAINT" && !value.sourceReportId) context.addIssue({code: "custom", path: ["sourceReportId"], message: "Для COMPLAINT обязательна исходная жалоба"});
    }).parse(request.body);
    const result = await query<{id: string}>(`
      INSERT INTO moderation."tRestriction" (
        "accountId", "scopeId", "permissionId", "restrictionStatusId", "sourceType", "sourceReportId",
        "reasonCode", "details", "validUntilDtm", "createByAccountId"
      )
      SELECT account."id", scope."id", permission."id", status."id", $5, report."id", $7, $8, $9, $10
      FROM account."tAccount" account
      JOIN access."tScope" scope ON scope."code" = $2
      JOIN moderation."tRestrictionStatus" status ON status."code" = $4
      LEFT JOIN access."tPermission" permission ON permission."code" = $3
      LEFT JOIN moderation."tReport" report ON report."publicId" = $6
      WHERE account."publicId" = $1
        AND ($3::TEXT IS NULL OR permission."id" IS NOT NULL)
        AND ($5 <> 'COMPLAINT' OR report."id" IS NOT NULL)
      RETURNING "publicId"::TEXT AS "id"
    `, [input.accountId, input.scopeCode, input.permissionCode ?? null, input.statusCode, input.sourceType, input.sourceReportId ?? null, input.reasonCode, input.details ?? null, input.validUntilDtm ?? null, context.accountId]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, "RESTRICTION_REFERENCE_NOT_FOUND", "Аккаунт, scope, permission, report или status не найден");
    return reply.status(201).send(row);
  });

  app.patch("/api/v1/admin/moderation/restrictions/:restrictionId/status", async (request) => {
    await requirePermission(request, "moderation.restriction.manage");
    const {restrictionId} = z.object({restrictionId: z.uuid()}).parse(request.params);
    const {statusCode} = z.object({statusCode: z.string().min(1).max(32)}).parse(request.body);
    await withTransaction(async (client) => {
      const current = await currentCode(`moderation."tRestriction"`, `moderation."tRestrictionStatus"`, "restrictionStatusId", restrictionId, client);
      if (!current) throw new ApiError(404, "RESTRICTION_NOT_FOUND", "Ограничение не найдено");
      if (!RestrictionTransitions[current.status]?.includes(statusCode)) throw new ApiError(409, "INVALID_RESTRICTION_TRANSITION", `Переход ${current.status} → ${statusCode} запрещён`);
      const updated = await client.query(`UPDATE moderation."tRestriction" restriction SET "restrictionStatusId" = status."id", "revokeDtm" = CASE WHEN status."code" = 'REVOKED' THEN CURRENT_TIMESTAMP ELSE restriction."revokeDtm" END FROM moderation."tRestrictionStatus" status WHERE restriction."id" = $1 AND status."code" = $2 RETURNING restriction."id"`, [current.id, statusCode]);
      if (!updated.rows[0]) throw new ApiError(400, "RESTRICTION_STATUS_NOT_FOUND", "Статус ограничения не найден");
    });
    return {ok: true};
  });

  app.get("/api/v1/admin/moderation/appeals", async (request) => {
    await requirePermission(request, "moderation.report.review");
    const filters = z.object({limit: z.coerce.number().int().min(1).max(200).default(100), status: z.string().max(32).optional()}).parse(request.query);
    const result = await query(`
      SELECT appeal."publicId"::TEXT AS "id", restriction."publicId"::TEXT AS "restrictionId",
             account."publicId"::TEXT AS "accountId", profile."displayName", status."code" AS "status", status."name" AS "statusName",
             appeal."statement", appeal."resolution", appeal."createDtm", appeal."resolveDtm",
             restriction."reasonCode", restrictionStatus."code" AS "restrictionStatus"
      FROM moderation."tAppeal" appeal
      JOIN moderation."tRestriction" restriction ON restriction."id" = appeal."restrictionId"
      JOIN moderation."tRestrictionStatus" restrictionStatus ON restrictionStatus."id" = restriction."restrictionStatusId"
      JOIN account."tAccount" account ON account."id" = appeal."accountId"
      JOIN account."tProfile" profile ON profile."accountId" = account."id"
      JOIN moderation."tAppealStatus" status ON status."id" = appeal."appealStatusId"
      WHERE ($1::TEXT IS NULL OR status."code" = $1)
      ORDER BY appeal."createDtm" DESC LIMIT $2
    `, [filters.status ?? null, filters.limit]);
    return {items: result.rows};
  });

  app.patch("/api/v1/admin/moderation/appeals/:appealId/status", async (request) => {
    await requirePermission(request, "moderation.report.review");
    const {appealId} = z.object({appealId: z.uuid()}).parse(request.params);
    const input = z.object({statusCode: z.string().min(1).max(32), resolution: z.string().trim().min(1).max(10000)}).parse(request.body);
    await withTransaction(async (client) => {
      const current = await currentCode(`moderation."tAppeal"`, `moderation."tAppealStatus"`, "appealStatusId", appealId, client);
      if (!current) throw new ApiError(404, "APPEAL_NOT_FOUND", "Апелляция не найдена");
      if (!AppealTransitions[current.status]?.includes(input.statusCode)) throw new ApiError(409, "INVALID_APPEAL_TRANSITION", `Переход ${current.status} → ${input.statusCode} запрещён`);
      const appeal = await client.query<{restrictionId: string}>(`
        UPDATE moderation."tAppeal" appeal SET "appealStatusId" = status."id",
          "resolveDtm" = CASE WHEN status."isFinal" THEN CURRENT_TIMESTAMP ELSE NULL END, "resolution" = $3
        FROM moderation."tAppealStatus" status WHERE appeal."id" = $1 AND status."code" = $2
        RETURNING appeal."restrictionId"::TEXT AS "restrictionId"
      `, [current.id, input.statusCode, input.resolution]);
      const row = appeal.rows[0];
      if (!row) throw new ApiError(400, "APPEAL_STATUS_NOT_FOUND", "Статус апелляции не найден");
      if (input.statusCode === "OVERTURNED") {
        await client.query(`UPDATE moderation."tRestriction" restriction SET "restrictionStatusId" = status."id", "revokeDtm" = CURRENT_TIMESTAMP FROM moderation."tRestrictionStatus" status WHERE restriction."id" = $1 AND status."code" = 'REVOKED'`, [row.restrictionId]);
      }
    });
    return {ok: true};
  });
}
