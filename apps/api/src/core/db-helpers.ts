import type {DatabaseClient} from "./database.js";
import {query} from "./database.js";
import {ApiError} from "./http/api-error.js";

export async function lookupId(table: string, code: string, client: DatabaseClient = {query}) {
  const result = await client.query<{id: string}>(`SELECT "id" FROM ${table} WHERE "code" = $1`, [code]);
  const row = result.rows[0];
  if (!row) throw new ApiError(400, "REFERENCE_NOT_FOUND", `Справочник ${code} не найден`);
  return row.id;
}

export async function findResourceId(publicId: string, client: DatabaseClient = {query}) {
  const result = await client.query<{id: string}>(`
    SELECT "id" FROM core."tResource" WHERE "publicId" = $1 AND "deleteDtm" IS NULL
  `, [publicId]);
  const row = result.rows[0];
  if (!row) throw new ApiError(404, "RESOURCE_NOT_FOUND", "Ресурс не найден");
  return row.id;
}

export async function findContentId(publicId: string, client: DatabaseClient = {query}) {
  const result = await client.query<{id: string; resourceId: string}>(`
    SELECT "id", "resourceId" FROM content."tContent" WHERE "publicId" = $1 AND "retireDtm" IS NULL
  `, [publicId]);
  const row = result.rows[0];
  if (!row) throw new ApiError(404, "CONTENT_NOT_FOUND", "Контент не найден");
  return row;
}

export async function createResource(resourceTypeCode: string, client: DatabaseClient = {query}) {
  const result = await client.query<{id: string; publicId: string}>(`
    INSERT INTO core."tResource" ("resourceTypeId")
    SELECT "id" FROM core."tResourceType" WHERE "code" = $1
    RETURNING "id", "publicId"::TEXT AS "publicId"
  `, [resourceTypeCode]);
  const row = result.rows[0];
  if (!row) throw new ApiError(400, "RESOURCE_TYPE_NOT_FOUND", "Тип ресурса не найден");
  return row;
}

export async function writeOutboxEvent(input: {
  ownerServiceCode: string;
  eventType: string;
  payload: Record<string, unknown>;
  aggregatePublicId?: string | null;
}, client: DatabaseClient = {query}) {
  const result = await client.query(`
    INSERT INTO core."tOutboxEvent" ("ownerServiceId", "aggregatePublicId", "eventType", "payload")
    SELECT service."id", $2, $3, $4::JSONB
    FROM core."tService" service
    WHERE service."code" = $1
  `, [input.ownerServiceCode, input.aggregatePublicId ?? null, input.eventType, JSON.stringify(input.payload)]);
  if (result.rowCount === 0) throw new ApiError(400, "SERVICE_NOT_FOUND", "Сервис-владелец события не найден");
}

export async function writeAuditEvent(input: {
  categoryCode: string;
  serviceCode: string;
  actionCode: string;
  outcomeCode?: "SUCCESS" | "DENIED" | "FAILURE" | "PENDING";
  actorAccountId?: string | null;
  actorSessionId?: string | null;
  targetResourceId?: string | null;
  details?: Record<string, unknown>;
}, client: DatabaseClient = {query}) {
  await client.query(`
    INSERT INTO audit."tAuditEvent" (
      "auditCategoryId", "serviceId", "actorAccountId", "actorSessionId",
      "actionCode", "targetResourceId", "outcomeCode", "details"
    )
    SELECT category."id", service."id", $3, $4, $5, $6, $7, $8::JSONB
    FROM audit."tAuditCategory" category
    CROSS JOIN core."tService" service
    WHERE category."code" = $1
      AND service."code" = $2
  `, [
    input.categoryCode,
    input.serviceCode,
    input.actorAccountId ?? null,
    input.actorSessionId ?? null,
    input.actionCode,
    input.targetResourceId ?? null,
    input.outcomeCode ?? "SUCCESS",
    JSON.stringify(input.details ?? {}),
  ]);
}
