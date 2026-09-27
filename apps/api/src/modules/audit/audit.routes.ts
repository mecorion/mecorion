import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query} from "../../core/database.js";
import {writeAuditEvent, writeOutboxEvent} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";

export async function registerAuditRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/audit/events", async (request) => {
    await requirePermission(request, "platform.admin");
    const filters = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
      category: z.string().optional(),
      service: z.string().optional(),
      outcome: z.enum(["SUCCESS", "DENIED", "FAILURE", "PENDING"]).optional(),
      q: z.string().optional(),
    }).parse(request.query);
    const result = await query(`
      SELECT event."publicId"::TEXT AS "id", category."code" AS "category", service."code" AS "service",
             event."actionCode", event."outcomeCode", event."details", event."correlationPublicId"::TEXT AS "correlationId",
             profile."displayName" AS "actorName", profile."username"::TEXT AS "actorUsername",
             resource."publicId"::TEXT AS "targetResourceId", resourceType."code" AS "targetResourceType", event."occurDtm"
      FROM audit."tAuditEvent" event
      JOIN audit."tAuditCategory" category ON category."id" = event."auditCategoryId"
      JOIN core."tService" service ON service."id" = event."serviceId"
      LEFT JOIN account."tProfile" profile ON profile."accountId" = event."actorAccountId"
      LEFT JOIN core."tResource" resource ON resource."id" = event."targetResourceId"
      LEFT JOIN core."tResourceType" resourceType ON resourceType."id" = resource."resourceTypeId"
      WHERE ($2::TEXT IS NULL OR category."code" = $2)
        AND ($3::TEXT IS NULL OR service."code" = $3)
        AND ($4::TEXT IS NULL OR event."outcomeCode" = $4)
        AND ($5::TEXT IS NULL OR event."actionCode" ILIKE '%' || $5 || '%' OR profile."displayName" ILIKE '%' || $5 || '%' OR resource."publicId"::TEXT ILIKE '%' || $5 || '%')
      ORDER BY event."occurDtm" DESC
      LIMIT $1
    `, [filters.limit, filters.category ?? null, filters.service ?? null, filters.outcome ?? null, filters.q || null]);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/audit/references", async (request) => {
    await requirePermission(request, "platform.admin");
    const [categories, services] = await Promise.all([
      query(`SELECT "code", "name" FROM audit."tAuditCategory" ORDER BY "name"`),
      query(`SELECT "code", "name" FROM core."tService" WHERE "isActive" = TRUE ORDER BY "name"`),
    ]);
    return {categories: categories.rows, services: services.rows, outcomes: ["SUCCESS", "DENIED", "FAILURE", "PENDING"]};
  });

  app.get("/api/v1/admin/outbox/events", async (request) => {
    await requirePermission(request, "platform.admin");
    const filters = z.object({state: z.enum(["all", "pending", "published", "failed"]).default("all"), service: z.string().optional(), q: z.string().optional()}).parse(request.query);
    const result = await query(`
      SELECT event."publicId"::TEXT AS "id", service."code" AS "ownerService",
             event."eventType", event."eventVersion", event."payload",
             event."occurDtm", event."publishDtm", event."attemptCount", event."lastError"
      FROM core."tOutboxEvent" event
      JOIN core."tService" service ON service."id" = event."ownerServiceId"
      WHERE ($1 = 'all' OR ($1 = 'pending' AND event."publishDtm" IS NULL AND event."lastError" IS NULL)
        OR ($1 = 'published' AND event."publishDtm" IS NOT NULL) OR ($1 = 'failed' AND event."publishDtm" IS NULL AND event."lastError" IS NOT NULL))
        AND ($2::TEXT IS NULL OR service."code" = $2)
        AND ($3::TEXT IS NULL OR event."eventType" ILIKE '%' || $3 || '%' OR event."aggregatePublicId"::TEXT ILIKE '%' || $3 || '%')
      ORDER BY event."occurDtm" DESC
      LIMIT 200
    `, [filters.state, filters.service ?? null, filters.q || null]);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/outbox/events", async (request, reply) => {
    const context = await requirePermission(request, "platform.admin");
    const input = z.object({
      ownerServiceCode: z.string().min(1).max(64),
      eventType: z.string().regex(/^[a-z][a-z0-9.]{2,127}$/),
      payload: z.record(z.string(), z.unknown()).default({}),
      aggregatePublicId: z.uuid().optional(),
    }).parse(request.body);
    await writeOutboxEvent({
      ownerServiceCode: input.ownerServiceCode,
      eventType: input.eventType,
      payload: input.payload,
      ...(input.aggregatePublicId ? {aggregatePublicId: input.aggregatePublicId} : {}),
    });
    await writeAuditEvent({categoryCode: "CONTENT", serviceCode: "core", actionCode: "outbox.event.enqueued", actorAccountId: context.accountId, actorSessionId: context.sessionId, details: {eventType: input.eventType, ownerService: input.ownerServiceCode}});
    return reply.status(201).send({ok: true});
  });

  app.patch("/api/v1/admin/outbox/events/:id/publish", async (request) => {
    const context = await requirePermission(request, "platform.admin");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query(`UPDATE core."tOutboxEvent" SET "publishDtm" = CURRENT_TIMESTAMP, "attemptCount" = "attemptCount" + 1, "lastError" = NULL WHERE "publicId" = $1 AND "publishDtm" IS NULL`, [params.id]);
    if (result.rowCount === 0) throw new ApiError(404, "OUTBOX_EVENT_NOT_FOUND", "Неопубликованное событие не найдено");
    await writeAuditEvent({categoryCode: "CONTENT", serviceCode: "core", actionCode: "outbox.event.marked_published", actorAccountId: context.accountId, actorSessionId: context.sessionId, details: {eventId: params.id}});
    return {ok: true};
  });

  app.patch("/api/v1/admin/outbox/events/:id/fail", async (request) => {
    const context = await requirePermission(request, "platform.admin");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const input = z.object({error: z.string().trim().min(1).max(4000)}).parse(request.body);
    const result = await query(`UPDATE core."tOutboxEvent" SET "attemptCount" = "attemptCount" + 1, "lastError" = $2 WHERE "publicId" = $1 AND "publishDtm" IS NULL`, [params.id, input.error]);
    if (result.rowCount === 0) throw new ApiError(404, "OUTBOX_EVENT_NOT_FOUND", "Неопубликованное событие не найдено");
    await writeAuditEvent({categoryCode: "CONTENT", serviceCode: "core", actionCode: "outbox.event.failed", outcomeCode: "FAILURE", actorAccountId: context.accountId, actorSessionId: context.sessionId, details: {eventId: params.id, error: input.error}});
    return {ok: true};
  });

  app.patch("/api/v1/admin/outbox/events/:id/retry", async (request) => {
    const context = await requirePermission(request, "platform.admin");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query(`UPDATE core."tOutboxEvent" SET "publishDtm" = NULL, "lastError" = NULL WHERE "publicId" = $1`, [params.id]);
    if (result.rowCount === 0) throw new ApiError(404, "OUTBOX_EVENT_NOT_FOUND", "Событие не найдено");
    await writeAuditEvent({categoryCode: "CONTENT", serviceCode: "core", actionCode: "outbox.event.retry_requested", actorAccountId: context.accountId, actorSessionId: context.sessionId, details: {eventId: params.id}});
    return {ok: true};
  });
}
