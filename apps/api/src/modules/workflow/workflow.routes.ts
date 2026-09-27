import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction, type DatabaseClient} from "../../core/database.js";
import {findResourceId} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requireAuth, requirePermission} from "../../core/http/auth-context.js";

const RequestIdSchema = z.object({requestId: z.uuid()});
const AllowedTransitions: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["AUTO_CHECK", "COMMUNITY_REVIEW", "NEEDS_CHANGES", "APPROVED", "REJECTED", "CANCELLED"],
  AUTO_CHECK: ["COMMUNITY_REVIEW", "NEEDS_CHANGES", "APPROVED", "REJECTED", "CANCELLED"],
  COMMUNITY_REVIEW: ["NEEDS_CHANGES", "APPROVED", "REJECTED", "CANCELLED"],
  NEEDS_CHANGES: ["SUBMITTED", "CANCELLED"],
};

async function changeRequestStatus(input: {
  requestId: string;
  statusCode: string;
  actorAccountId: string;
  reason?: string | null;
}, client: DatabaseClient) {
  const current = await client.query<{id: string; status: string}>(`
    SELECT request."id"::TEXT AS "id", status."code" AS "status"
    FROM workflow."tRequest" request
    JOIN workflow."tRequestStatus" status ON status."id" = request."requestStatusId"
    WHERE request."publicId" = $1
    FOR UPDATE OF request
  `, [input.requestId]);
  const row = current.rows[0];
  if (!row) throw new ApiError(404, "REQUEST_NOT_FOUND", "Заявка не найдена");
  if (row.status === input.statusCode) return;
  if (!AllowedTransitions[row.status]?.includes(input.statusCode)) {
    throw new ApiError(409, "INVALID_REQUEST_TRANSITION", `Переход ${row.status} → ${input.statusCode} запрещён`);
  }
  const updated = await client.query(`
    UPDATE workflow."tRequest" request
    SET "requestStatusId" = status."id",
        "submitDtm" = CASE WHEN status."code" = 'SUBMITTED' THEN COALESCE(request."submitDtm", CURRENT_TIMESTAMP) ELSE request."submitDtm" END,
        "completeDtm" = CASE WHEN status."isFinal" THEN CURRENT_TIMESTAMP ELSE NULL END
    FROM workflow."tRequestStatus" status
    WHERE request."id" = $1 AND status."code" = $2
    RETURNING request."id"
  `, [row.id, input.statusCode]);
  if (!updated.rows[0]) throw new ApiError(400, "REQUEST_STATUS_NOT_FOUND", "Статус заявки не найден");
  await client.query(`
    INSERT INTO workflow."tRequestStatusHistory" (
      "requestId", "requestStatusId", "changeByAccountId", "changeSource", "reason"
    )
    SELECT $1, status."id", $3, 'SYSTEM', $4
    FROM workflow."tRequestStatus" status WHERE status."code" = $2
  `, [row.id, input.statusCode, input.actorAccountId, input.reason ?? null]);
}

export async function registerWorkflowRoutes(app: FastifyInstance) {
  app.get("/api/v1/workflow/requests", async (request) => {
    const context = await requireAuth(request);
    const result = await query(`
      SELECT request."publicId"::TEXT AS "id", type."code" AS "type", status."code" AS "status",
             request."title", request."payload", request."submitDtm", request."completeDtm"
      FROM workflow."tRequest" request
      JOIN workflow."tRequestType" type ON type."id" = request."requestTypeId"
      JOIN workflow."tRequestStatus" status ON status."id" = request."requestStatusId"
      WHERE request."createByAccountId" = $1
      ORDER BY request."createDtm" DESC LIMIT 100
    `, [context.accountId]);
    return {items: result.rows};
  });

  app.post("/api/v1/workflow/requests", async (request, reply) => {
    const context = await requireAuth(request);
    const input = z.object({
      typeCode: z.string().min(1).max(64),
      title: z.string().trim().min(1).max(512),
      payload: z.record(z.string(), z.unknown()).default({}),
      targetResourceIds: z.array(z.uuid()).default([]),
      submit: z.boolean().default(false),
    }).parse(request.body);
    const statusCode = input.submit ? "SUBMITTED" : "DRAFT";
    const created = await withTransaction(async (client) => {
      const result = await client.query<{id: string; publicId: string}>(`
        INSERT INTO workflow."tRequest" ("requestTypeId", "requestStatusId", "createByAccountId", "title", "payload", "submitDtm")
        SELECT type."id", status."id", $3, $4, $5::JSONB, CASE WHEN $6 THEN CURRENT_TIMESTAMP ELSE NULL END
        FROM workflow."tRequestType" type
        JOIN workflow."tRequestStatus" status ON status."code" = $2
        WHERE type."code" = $1 AND type."isActive" = TRUE
        RETURNING "id", "publicId"::TEXT AS "publicId"
      `, [input.typeCode, statusCode, context.accountId, input.title, JSON.stringify(input.payload), input.submit]);
      const row = result.rows[0];
      if (!row) throw new ApiError(400, "REQUEST_REFERENCE_NOT_FOUND", "Тип или статус заявки не найден");
      await client.query(`
        INSERT INTO workflow."tRequestRevision" ("requestId", "revisionNumber", "payload", "createByAccountId")
        VALUES ($1, 1, $2::JSONB, $3)
      `, [row.id, JSON.stringify(input.payload), context.accountId]);
      for (const resourcePublicId of input.targetResourceIds) {
        const resourceId = await findResourceId(resourcePublicId, client);
        await client.query(`INSERT INTO workflow."tRequestTarget" ("requestId", "resourceId") VALUES ($1, $2)`, [row.id, resourceId]);
      }
      if (input.submit) {
        await client.query(`
          INSERT INTO workflow."tRequestStatusHistory" ("requestId", "requestStatusId", "changeByAccountId", "changeSource", "reason")
          SELECT $1, status."id", $2, 'AUTHOR', 'Submitted on creation'
          FROM workflow."tRequestStatus" status WHERE status."code" = 'SUBMITTED'
        `, [row.id, context.accountId]);
      }
      return {id: row.publicId};
    });
    return reply.status(201).send(created);
  });

  app.post("/api/v1/workflow/requests/:requestId/submit", async (request) => {
    const context = await requireAuth(request);
    const {requestId} = RequestIdSchema.parse(request.params);
    const input = z.object({payload: z.record(z.string(), z.unknown()).optional()}).parse(request.body ?? {});
    await withTransaction(async (client) => {
      const target = await client.query<{id: string; payload: Record<string, unknown>}>(`
        SELECT request."id"::TEXT AS "id", request."payload"
        FROM workflow."tRequest" request
        JOIN workflow."tRequestStatus" status ON status."id" = request."requestStatusId"
        WHERE request."publicId" = $1 AND request."createByAccountId" = $2
          AND status."code" IN ('DRAFT', 'NEEDS_CHANGES')
        FOR UPDATE OF request
      `, [requestId, context.accountId]);
      const row = target.rows[0];
      if (!row) throw new ApiError(409, "REQUEST_NOT_SUBMITTABLE", "Заявка не найдена или недоступна для отправки");
      const payload = input.payload ?? row.payload;
      await client.query(`UPDATE workflow."tRequest" SET "payload" = $2::JSONB WHERE "id" = $1`, [row.id, JSON.stringify(payload)]);
      await client.query(`
        INSERT INTO workflow."tRequestRevision" ("requestId", "revisionNumber", "payload", "createByAccountId")
        SELECT $1, COALESCE(MAX(revision."revisionNumber"), 0) + 1, $2::JSONB, $3
        FROM workflow."tRequestRevision" revision WHERE revision."requestId" = $1
      `, [row.id, JSON.stringify(payload), context.accountId]);
      await changeRequestStatus({requestId, statusCode: "SUBMITTED", actorAccountId: context.accountId, reason: "Submitted for review"}, client);
    });
    return {ok: true};
  });

  app.get("/api/v1/admin/workflow/references", async (request) => {
    await requirePermission(request, "workflow.request.review");
    const [types, statuses, reviewTypes] = await Promise.all([
      query(`SELECT type."code", type."name", service."code" AS "service" FROM workflow."tRequestType" type JOIN core."tService" service ON service."id" = type."ownerServiceId" WHERE type."isActive" = TRUE ORDER BY type."name"`),
      query(`SELECT "code", "name", "isFinal" FROM workflow."tRequestStatus" ORDER BY "id"`),
      query(`SELECT "code", "name" FROM workflow."tReviewType" ORDER BY "id"`),
    ]);
    return {types: types.rows, statuses: statuses.rows, reviewTypes: reviewTypes.rows};
  });

  app.get("/api/v1/admin/workflow/requests", async (request) => {
    await requirePermission(request, "workflow.request.review");
    const filters = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
      offset: z.coerce.number().int().min(0).default(0),
      status: z.string().max(32).optional(), type: z.string().max(64).optional(),
      q: z.string().trim().max(200).optional(),
    }).parse(request.query);
    const result = await query(`
      SELECT request."publicId"::TEXT AS "id", type."code" AS "type", type."name" AS "typeName",
             status."code" AS "status", status."name" AS "statusName", request."title", request."payload",
             profile."displayName" AS "createdBy", request."createDtm", request."submitDtm", request."completeDtm",
             COUNT(DISTINCT review."id")::INT AS "reviewCount", COUNT(DISTINCT target."resourceId")::INT AS "targetCount"
      FROM workflow."tRequest" request
      JOIN workflow."tRequestType" type ON type."id" = request."requestTypeId"
      JOIN workflow."tRequestStatus" status ON status."id" = request."requestStatusId"
      LEFT JOIN account."tProfile" profile ON profile."accountId" = request."createByAccountId"
      LEFT JOIN workflow."tReview" review ON review."requestId" = request."id"
      LEFT JOIN workflow."tRequestTarget" target ON target."requestId" = request."id"
      WHERE ($1::TEXT IS NULL OR status."code" = $1) AND ($2::TEXT IS NULL OR type."code" = $2)
        AND ($3::TEXT IS NULL OR request."title" ILIKE '%' || $3 || '%' OR profile."displayName" ILIKE '%' || $3 || '%')
      GROUP BY request."id", type."code", type."name", status."code", status."name", profile."displayName"
      ORDER BY COALESCE(request."submitDtm", request."createDtm") DESC LIMIT $4 OFFSET $5
    `, [filters.status ?? null, filters.type ?? null, filters.q || null, filters.limit, filters.offset]);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/workflow/requests/:requestId", async (request) => {
    await requirePermission(request, "workflow.request.review");
    const {requestId} = RequestIdSchema.parse(request.params);
    const [requestResult, revisions, reviews, history, targets] = await Promise.all([
      query(`SELECT request."publicId"::TEXT AS "id", type."code" AS "type", type."name" AS "typeName", status."code" AS "status", status."name" AS "statusName", request."title", request."payload", profile."displayName" AS "createdBy", request."createDtm", request."submitDtm", request."completeDtm" FROM workflow."tRequest" request JOIN workflow."tRequestType" type ON type."id" = request."requestTypeId" JOIN workflow."tRequestStatus" status ON status."id" = request."requestStatusId" LEFT JOIN account."tProfile" profile ON profile."accountId" = request."createByAccountId" WHERE request."publicId" = $1`, [requestId]),
      query(`SELECT revision."revisionNumber", revision."payload", profile."displayName" AS "createdBy", revision."createDtm" FROM workflow."tRequestRevision" revision JOIN workflow."tRequest" request ON request."id" = revision."requestId" LEFT JOIN account."tProfile" profile ON profile."accountId" = revision."createByAccountId" WHERE request."publicId" = $1 ORDER BY revision."revisionNumber" DESC`, [requestId]),
      query(`SELECT review."publicId"::TEXT AS "id", type."code" AS "type", review."decisionCode" AS "decision", review."score", review."comment", review."evidence", profile."displayName" AS "reviewedBy", review."reviewerRoleCode", review."createDtm" FROM workflow."tReview" review JOIN workflow."tRequest" request ON request."id" = review."requestId" JOIN workflow."tReviewType" type ON type."id" = review."reviewTypeId" LEFT JOIN account."tProfile" profile ON profile."accountId" = review."reviewByAccountId" WHERE request."publicId" = $1 ORDER BY review."createDtm" DESC`, [requestId]),
      query(`SELECT status."code" AS "status", status."name" AS "statusName", history."changeSource", history."reason", profile."displayName" AS "changedBy", history."changeDtm" FROM workflow."tRequestStatusHistory" history JOIN workflow."tRequest" request ON request."id" = history."requestId" JOIN workflow."tRequestStatus" status ON status."id" = history."requestStatusId" LEFT JOIN account."tProfile" profile ON profile."accountId" = history."changeByAccountId" WHERE request."publicId" = $1 ORDER BY history."changeDtm" DESC`, [requestId]),
      query(`SELECT resource."publicId"::TEXT AS "id", type."code" AS "type", target."targetRole" AS "role" FROM workflow."tRequestTarget" target JOIN workflow."tRequest" request ON request."id" = target."requestId" JOIN core."tResource" resource ON resource."id" = target."resourceId" JOIN core."tResourceType" type ON type."id" = resource."resourceTypeId" WHERE request."publicId" = $1`, [requestId]),
    ]);
    const item = requestResult.rows[0];
    if (!item) throw new ApiError(404, "REQUEST_NOT_FOUND", "Заявка не найдена");
    return {item, revisions: revisions.rows, reviews: reviews.rows, history: history.rows, targets: targets.rows};
  });

  app.post("/api/v1/admin/workflow/requests/:requestId/reviews", async (request, reply) => {
    const context = await requirePermission(request, "workflow.request.review");
    const {requestId} = RequestIdSchema.parse(request.params);
    const input = z.object({
      reviewTypeCode: z.string().min(1).max(32), reviewerRoleCode: z.string().min(1).max(64).default("ADMIN"),
      decisionCode: z.enum(["APPROVE", "REJECT", "NEEDS_CHANGES", "ABSTAIN", "POSSIBLE_DUPLICATE"]),
      score: z.number().min(0).max(1).optional(), comment: z.string().max(10000).optional(),
      evidence: z.record(z.string(), z.unknown()).default({}), applyDecision: z.boolean().default(true),
    }).parse(request.body);
    const statusByDecision: Partial<Record<typeof input.decisionCode, string>> = {
      APPROVE: "APPROVED", REJECT: "REJECTED", NEEDS_CHANGES: "NEEDS_CHANGES",
    };
    const nextStatus = statusByDecision[input.decisionCode];
    const result = await withTransaction(async (client) => {
      const review = await client.query<{id: string}>(`
        INSERT INTO workflow."tReview" ("requestId", "reviewTypeId", "reviewByAccountId", "reviewerRoleCode", "decisionCode", "score", "comment", "evidence")
        SELECT request."id", type."id", $3, $4, $5, $6, $7, $8::JSONB
        FROM workflow."tRequest" request
        JOIN workflow."tReviewType" type ON type."code" = $2
        JOIN workflow."tRequestStatus" status ON status."id" = request."requestStatusId"
        WHERE request."publicId" = $1
          AND status."code" IN ('SUBMITTED', 'AUTO_CHECK', 'COMMUNITY_REVIEW')
        RETURNING "publicId"::TEXT AS "id"
      `, [requestId, input.reviewTypeCode, context.accountId, input.reviewerRoleCode, input.decisionCode, input.score ?? null, input.comment ?? null, JSON.stringify(input.evidence)]);
      const row = review.rows[0];
      if (!row) throw new ApiError(409, "REQUEST_NOT_REVIEWABLE", "Заявка, тип проверки или состояние недоступны");
      if (input.applyDecision && nextStatus) await changeRequestStatus({requestId, statusCode: nextStatus, actorAccountId: context.accountId, reason: input.comment ?? null}, client);
      return row;
    });
    return reply.status(201).send(result);
  });

  app.patch("/api/v1/admin/workflow/requests/:requestId/status", async (request) => {
    const context = await requirePermission(request, "workflow.request.review");
    const {requestId} = RequestIdSchema.parse(request.params);
    const input = z.object({statusCode: z.string().min(1).max(32), reason: z.string().max(5000).optional()}).parse(request.body);
    await withTransaction((client) => changeRequestStatus({requestId, statusCode: input.statusCode, actorAccountId: context.accountId, reason: input.reason ?? null}, client));
    return {ok: true};
  });
}
