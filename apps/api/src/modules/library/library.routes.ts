import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction} from "../../core/database.js";
import {createResource, findContentId, findResourceId, writeAuditEvent} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requireAuth, requirePermission} from "../../core/http/auth-context.js";

export async function registerLibraryRoutes(app: FastifyInstance) {
  app.get("/api/v1/library/devices", async (request) => {
    const context = await requireAuth(request);
    const result = await query(`
      SELECT "publicId"::TEXT AS "id", COALESCE("name", "platformCode", 'Устройство') AS "name",
             "platformCode", "lastSeenDtm", "trustDtm"
      FROM auth."tDevice" WHERE "accountId" = $1 AND "revokeDtm" IS NULL ORDER BY "lastSeenDtm" DESC
    `, [context.accountId]);
    return {items: result.rows};
  });

  app.get("/api/v1/library/collections", async (request) => {
    const context = await requireAuth(request);
    const result = await query(`
      SELECT collection."publicId"::TEXT AS "id", collection."name", collection."description",
             collection."visibilityCode" AS "visibility", type."code" AS "type",
             resource."publicId"::TEXT AS "resourceId"
      FROM library."tCollection" collection
      JOIN library."tCollectionType" type ON type."id" = collection."collectionTypeId"
      JOIN core."tResource" resource ON resource."id" = collection."resourceId"
      WHERE collection."ownerAccountId" = $1 AND collection."deleteDtm" IS NULL
      ORDER BY collection."createDtm" DESC
    `, [context.accountId]);
    return {items: result.rows};
  });

  app.post("/api/v1/library/collections", async (request, reply) => {
    const context = await requireAuth(request);
    const input = z.object({
      typeCode: z.string().default("PLAYLIST"),
      name: z.string().trim().min(1).max(256),
      description: z.string().max(5000).optional(),
      visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).default("PRIVATE"),
    }).parse(request.body);
    const resource = await createResource("collection");
    const result = await query<{id: string; resourceId: string}>(`
      INSERT INTO library."tCollection" ("resourceId", "ownerAccountId", "collectionTypeId", "name", "description", "visibilityCode")
      SELECT $1, $2, type."id", $3, $4, $5
      FROM library."tCollectionType" type
      WHERE type."code" = $6
      RETURNING "publicId"::TEXT AS "id", $7::TEXT AS "resourceId"
    `, [resource.id, context.accountId, input.name, input.description ?? null, input.visibility, input.typeCode, resource.publicId]);
    const row = result.rows[0];
    if (!row) throw new ApiError(400, "COLLECTION_TYPE_NOT_FOUND", "Тип коллекции не найден");
    return reply.status(201).send(row);
  });

  app.post("/api/v1/library/collections/:collectionId/items", async (request, reply) => {
    const context = await requireAuth(request);
    const params = z.object({collectionId: z.uuid()}).parse(request.params);
    const input = z.object({
      resourceId: z.uuid(),
      ordinal: z.number().int().positive().optional(),
    }).parse(request.body);
    const resourceId = await findResourceId(input.resourceId);
    const result = await query(`
      INSERT INTO library."tCollectionItem" ("collectionId", "resourceId", "ordinal", "addByAccountId")
      SELECT collection."id", $3, COALESCE($4, (
        SELECT COALESCE(MAX(item."ordinal"), 0) + 1 FROM library."tCollectionItem" item WHERE item."collectionId" = collection."id" AND item."removeDtm" IS NULL
      )), $2
      FROM library."tCollection" collection
      WHERE collection."publicId" = $1
        AND collection."ownerAccountId" = $2
        AND collection."deleteDtm" IS NULL
    `, [params.collectionId, context.accountId, resourceId, input.ordinal ?? null]);
    if (result.rowCount === 0) throw new ApiError(404, "COLLECTION_NOT_FOUND", "Коллекция не найдена");
    return reply.status(201).send({ok: true});
  });

  app.get("/api/v1/library/collections/:collectionId", async (request) => {
    const context = await requireAuth(request);
    const params = z.object({collectionId: z.uuid()}).parse(request.params);
    const collection = await query(`
      SELECT collection."publicId"::TEXT AS "id", collection."name", collection."description",
             collection."visibilityCode" AS "visibility", type."code" AS "type"
      FROM library."tCollection" collection
      JOIN library."tCollectionType" type ON type."id" = collection."collectionTypeId"
      WHERE collection."publicId" = $1 AND collection."ownerAccountId" = $2 AND collection."deleteDtm" IS NULL
    `, [params.collectionId, context.accountId]);
    if (!collection.rows[0]) throw new ApiError(404, "COLLECTION_NOT_FOUND", "Коллекция не найдена");
    const items = await query(`
      SELECT resource."publicId"::TEXT AS "resourceId", type."code" AS "resourceType",
             COALESCE(contentItem."originalTitle", publication."title", contributor."primaryName", resource."publicId"::TEXT) AS "name",
             item."ordinal", item."addDtm"
      FROM library."tCollectionItem" item
      JOIN core."tResource" resource ON resource."id" = item."resourceId"
      JOIN core."tResourceType" type ON type."id" = resource."resourceTypeId"
      LEFT JOIN content."tContent" contentItem ON contentItem."resourceId" = resource."id"
      LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id"
      LEFT JOIN content."tContributor" contributor ON contributor."resourceId" = resource."id"
      JOIN library."tCollection" collection ON collection."id" = item."collectionId"
      WHERE collection."publicId" = $1 AND item."removeDtm" IS NULL ORDER BY item."ordinal"
    `, [params.collectionId]);
    return {...collection.rows[0], items: items.rows};
  });

  app.delete("/api/v1/library/collections/:collectionId/items/:resourceId", async (request) => {
    const context = await requireAuth(request);
    const params = z.object({collectionId: z.uuid(), resourceId: z.uuid()}).parse(request.params);
    const resourceId = await findResourceId(params.resourceId);
    const result = await query(`
      UPDATE library."tCollectionItem" item SET "removeDtm" = CURRENT_TIMESTAMP
      FROM library."tCollection" collection
      WHERE collection."id" = item."collectionId" AND collection."publicId" = $1
        AND collection."ownerAccountId" = $2 AND item."resourceId" = $3 AND item."removeDtm" IS NULL
    `, [params.collectionId, context.accountId, resourceId]);
    if (result.rowCount === 0) throw new ApiError(404, "COLLECTION_ITEM_NOT_FOUND", "Элемент коллекции не найден");
    return {ok: true};
  });

  app.put("/api/v1/library/favorites/:resourceId", async (request) => {
    const context = await requireAuth(request);
    const params = z.object({resourceId: z.uuid()}).parse(request.params);
    const resourceId = await findResourceId(params.resourceId);
    await query(`
      INSERT INTO library."tFavorite" ("accountId", "resourceId")
      VALUES ($1, $2)
      ON CONFLICT ("accountId", "resourceId") DO NOTHING
    `, [context.accountId, resourceId]);
    return {ok: true};
  });

  app.delete("/api/v1/library/favorites/:resourceId", async (request) => {
    const context = await requireAuth(request);
    const params = z.object({resourceId: z.uuid()}).parse(request.params);
    const resourceId = await findResourceId(params.resourceId);
    await query(`DELETE FROM library."tFavorite" WHERE "accountId" = $1 AND "resourceId" = $2`, [context.accountId, resourceId]);
    return {ok: true};
  });

  app.get("/api/v1/library/favorites", async (request) => {
    const context = await requireAuth(request);
    const result = await query(`
      SELECT resource."publicId"::TEXT AS "resourceId", type."code" AS "resourceType",
             COALESCE(contentItem."originalTitle", publication."title", contributor."primaryName", resource."publicId"::TEXT) AS "name",
             favorite."createDtm"
      FROM library."tFavorite" favorite
      JOIN core."tResource" resource ON resource."id" = favorite."resourceId"
      JOIN core."tResourceType" type ON type."id" = resource."resourceTypeId"
      LEFT JOIN content."tContent" contentItem ON contentItem."resourceId" = resource."id"
      LEFT JOIN content."tPublication" publication ON publication."resourceId" = resource."id"
      LEFT JOIN content."tContributor" contributor ON contributor."resourceId" = resource."id"
      WHERE favorite."accountId" = $1 ORDER BY favorite."createDtm" DESC
    `, [context.accountId]);
    return {items: result.rows};
  });

  app.post("/api/v1/library/playback-events", async (request, reply) => {
    const context = await requireAuth(request);
    const input = z.object({
      contentId: z.uuid(),
      eventType: z.enum(["START", "PROGRESS", "PAUSE", "COMPLETE", "SKIP"]),
      positionMs: z.number().int().min(0).optional(),
      durationMs: z.number().int().positive().optional(),
    }).parse(request.body);
    const content = await findContentId(input.contentId);
    await withTransaction(async (client) => {
      await client.query(`
        INSERT INTO library."tPlaybackEvent" ("accountId", "contentId", "sessionId", "eventType", "positionMs")
        VALUES ($1, $2, $3, $4, $5)
      `, [context.accountId, content.id, context.sessionId, input.eventType, input.positionMs ?? null]);
      await client.query(`
        INSERT INTO library."tPlaybackProgress" ("accountId", "contentId", "positionMs", "durationMs", "isCompleted", "completeDtm")
        VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE NULL END)
        ON CONFLICT ("accountId", "contentId") DO UPDATE SET
          "positionMs" = EXCLUDED."positionMs",
          "durationMs" = COALESCE(EXCLUDED."durationMs", library."tPlaybackProgress"."durationMs"),
          "isCompleted" = EXCLUDED."isCompleted",
          "lastPlayDtm" = CURRENT_TIMESTAMP,
          "completeDtm" = EXCLUDED."completeDtm"
      `, [context.accountId, content.id, input.positionMs ?? 0, input.durationMs ?? null, input.eventType === "COMPLETE"]);
    });
    return reply.status(201).send({ok: true});
  });

  app.get("/api/v1/library/playback-progress", async (request) => {
    const context = await requireAuth(request);
    const result = await query(`
      SELECT contentItem."publicId"::TEXT AS "contentId", contentItem."originalTitle" AS "title",
             progress."positionMs", progress."durationMs", progress."isCompleted", progress."firstPlayDtm", progress."lastPlayDtm"
      FROM library."tPlaybackProgress" progress
      JOIN content."tContent" contentItem ON contentItem."id" = progress."contentId"
      WHERE progress."accountId" = $1 ORDER BY progress."lastPlayDtm" DESC LIMIT 200
    `, [context.accountId]);
    return {items: result.rows};
  });

  app.get("/api/v1/library/offline-grants", async (request) => {
    const context = await requireAuth(request);
    const result = await query(`
      SELECT grantEntry."publicId"::TEXT AS "id", contentItem."publicId"::TEXT AS "contentId", contentItem."originalTitle" AS "title",
             device."publicId"::TEXT AS "deviceId", COALESCE(device."name", device."platformCode", 'Устройство') AS "deviceName",
             status."code" AS "status", status."name" AS "statusName", grantEntry."grantDtm", grantEntry."expireDtm", grantEntry."lastValidateDtm", grantEntry."revokeDtm",
             COUNT(asset."assetVariantId")::INTEGER AS "assetCount"
      FROM library."tOfflineGrant" grantEntry
      JOIN content."tContent" contentItem ON contentItem."id" = grantEntry."contentId"
      JOIN auth."tDevice" device ON device."id" = grantEntry."deviceId"
      JOIN library."tOfflineGrantStatus" status ON status."id" = grantEntry."offlineGrantStatusId"
      LEFT JOIN library."tOfflineGrantAsset" asset ON asset."offlineGrantId" = grantEntry."id"
      WHERE grantEntry."accountId" = $1
      GROUP BY grantEntry."id", contentItem."publicId", contentItem."originalTitle", device."publicId", device."name", device."platformCode", status."code", status."name"
      ORDER BY grantEntry."grantDtm" DESC
    `, [context.accountId]);
    return {items: result.rows};
  });

  app.post("/api/v1/library/offline-grants", async (request, reply) => {
    const context = await requireAuth(request);
    const input = z.object({deviceId: z.uuid(), contentId: z.uuid(), ttlHours: z.number().int().min(1).max(720).default(72)}).parse(request.body);
    const content = await findContentId(input.contentId);
    const row = await withTransaction(async (client) => {
      const result = await client.query<{id: string; internalId: string}>(`
        INSERT INTO library."tOfflineGrant" ("accountId", "deviceId", "contentId", "offlineGrantStatusId", "expireDtm")
        SELECT $1, device."id", $3, status."id", CURRENT_TIMESTAMP + make_interval(hours => $4::INTEGER)
        FROM auth."tDevice" device CROSS JOIN library."tOfflineGrantStatus" status
        WHERE device."publicId" = $2 AND device."accountId" = $1 AND device."revokeDtm" IS NULL AND status."code" = 'ACTIVE'
        ON CONFLICT ("accountId", "deviceId", "contentId") WHERE "revokeDtm" IS NULL
        DO UPDATE SET "offlineGrantStatusId" = EXCLUDED."offlineGrantStatusId", "expireDtm" = EXCLUDED."expireDtm", "lastValidateDtm" = CURRENT_TIMESTAMP
        RETURNING "publicId"::TEXT AS "id", "id"::TEXT AS "internalId"
      `, [context.accountId, input.deviceId, content.id, input.ttlHours]);
      const created = result.rows[0];
      if (!created) throw new ApiError(400, "DEVICE_NOT_FOUND", "Активное устройство не найдено");
      await client.query(`
        INSERT INTO library."tOfflineGrantAsset" ("offlineGrantId", "assetVariantId")
        SELECT $1, variant."id" FROM media."tContentAsset" contentAsset
        JOIN media."tAssetVariant" variant ON variant."assetId" = contentAsset."assetId" AND variant."isOfflineAllowed" = TRUE
        WHERE contentAsset."contentId" = $2
        ON CONFLICT DO NOTHING
      `, [created.internalId, content.id]);
      return {id: created.id};
    });
    return reply.status(201).send(row);
  });

  app.delete("/api/v1/library/offline-grants/:id", async (request) => {
    const context = await requireAuth(request);
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query(`
      UPDATE library."tOfflineGrant" SET "offlineGrantStatusId" = (SELECT "id" FROM library."tOfflineGrantStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = CURRENT_TIMESTAMP
      WHERE "publicId" = $1 AND "accountId" = $2 AND "revokeDtm" IS NULL
    `, [params.id, context.accountId]);
    if (result.rowCount === 0) throw new ApiError(404, "OFFLINE_GRANT_NOT_FOUND", "Активное offline-разрешение не найдено");
    return {ok: true};
  });

  app.get("/api/v1/admin/library/collections", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`
      SELECT collection."publicId"::TEXT AS "id", collection."name", collection."description", collection."visibilityCode" AS "visibility",
             type."code" AS "type", profile."username"::TEXT AS "ownerUsername", profile."displayName" AS "ownerName",
             collection."createDtm", COUNT(item."id") FILTER (WHERE item."removeDtm" IS NULL)::INTEGER AS "itemCount"
      FROM library."tCollection" collection
      JOIN library."tCollectionType" type ON type."id" = collection."collectionTypeId"
      JOIN account."tProfile" profile ON profile."accountId" = collection."ownerAccountId"
      LEFT JOIN library."tCollectionItem" item ON item."collectionId" = collection."id"
      WHERE collection."deleteDtm" IS NULL
      GROUP BY collection."id", type."code", profile."username", profile."displayName"
      ORDER BY collection."createDtm" DESC
      LIMIT 200
    `);
    return {items: result.rows};
  });

  app.delete("/api/v1/admin/library/collections/:id", async (request) => {
    const context = await requirePermission(request, "platform.admin");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query<{resourceId: string}>(`UPDATE library."tCollection" SET "deleteDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1 AND "deleteDtm" IS NULL RETURNING "resourceId"::TEXT AS "resourceId"`, [params.id]);
    if (!result.rows[0]) throw new ApiError(404, "COLLECTION_NOT_FOUND", "Коллекция не найдена");
    await writeAuditEvent({categoryCode: "CONTENT", serviceCode: "library", actionCode: "library.collection.deleted", actorAccountId: context.accountId, actorSessionId: context.sessionId, targetResourceId: result.rows[0].resourceId, details: {collectionId: params.id}});
    return {ok: true};
  });

  app.get("/api/v1/admin/library/offline-grants", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`
      SELECT grantEntry."publicId"::TEXT AS "id", profile."displayName", profile."username"::TEXT AS "username",
             contentItem."originalTitle" AS "title", device."publicId"::TEXT AS "deviceId", COALESCE(device."name", device."platformCode", 'Устройство') AS "deviceName",
             status."code" AS "status", status."name" AS "statusName", grantEntry."grantDtm", grantEntry."expireDtm", grantEntry."revokeDtm"
      FROM library."tOfflineGrant" grantEntry JOIN account."tProfile" profile ON profile."accountId" = grantEntry."accountId"
      JOIN content."tContent" contentItem ON contentItem."id" = grantEntry."contentId"
      JOIN auth."tDevice" device ON device."id" = grantEntry."deviceId"
      JOIN library."tOfflineGrantStatus" status ON status."id" = grantEntry."offlineGrantStatusId"
      ORDER BY grantEntry."grantDtm" DESC LIMIT 300
    `);
    return {items: result.rows};
  });

  app.patch("/api/v1/admin/library/offline-grants/:id/revoke", async (request) => {
    const context = await requirePermission(request, "platform.admin");
    const params = z.object({id: z.uuid()}).parse(request.params);
    const result = await query(`
      UPDATE library."tOfflineGrant" SET "offlineGrantStatusId" = (SELECT "id" FROM library."tOfflineGrantStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = CURRENT_TIMESTAMP
      WHERE "publicId" = $1 AND "revokeDtm" IS NULL
    `, [params.id]);
    if (result.rowCount === 0) throw new ApiError(404, "OFFLINE_GRANT_NOT_FOUND", "Активное offline-разрешение не найдено");
    await writeAuditEvent({categoryCode: "CONTENT", serviceCode: "library", actionCode: "library.offline_grant.revoked", actorAccountId: context.accountId, actorSessionId: context.sessionId, details: {offlineGrantId: params.id}});
    return {ok: true};
  });

  app.get("/api/v1/admin/library/playback-progress", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`
      SELECT profile."displayName", profile."username"::TEXT AS "username", contentItem."originalTitle" AS "title",
             progress."positionMs", progress."durationMs", progress."isCompleted", progress."firstPlayDtm", progress."lastPlayDtm"
      FROM library."tPlaybackProgress" progress JOIN account."tProfile" profile ON profile."accountId" = progress."accountId"
      JOIN content."tContent" contentItem ON contentItem."id" = progress."contentId"
      ORDER BY progress."lastPlayDtm" DESC LIMIT 300
    `);
    return {items: result.rows};
  });
}
