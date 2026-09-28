import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction, type DatabaseClient} from "../../core/database.js";
import {writeAuditEvent} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";
import {NAVIGATION_ICON_CODES, PAGE_COMPONENT_KEYS, readNavigationItems} from "../platform/platform.navigation.js";

const RoleCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/);
const ItemParamsSchema = z.object({itemPublicId: z.uuid()});
const GroupParamsSchema = z.object({groupPublicId: z.uuid()});
const ItemUpdateSchema = z.object({
  label: z.string().trim().min(1).max(128),
  icon: z.enum(NAVIGATION_ICON_CODES),
  componentKey: z.enum(PAGE_COMPONENT_KEYS),
  groupCode: z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  isEnabled: z.boolean(),
  visibilityRoleCodes: z.array(RoleCodeSchema),
  accessRoleCodes: z.array(RoleCodeSchema),
});
const GroupUpdateSchema = z.object({
  label: z.string().trim().max(128).nullable(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  isEnabled: z.boolean(),
});

async function assertRolesExist(roleCodes: string[], client: DatabaseClient) {
  const uniqueCodes = [...new Set(roleCodes)];
  if (!uniqueCodes.length) return;
  const roles = await client.query(`SELECT "code" FROM access."tRole" WHERE "code" = ANY($1::VARCHAR[]) AND "isActive" = TRUE`, [uniqueCodes]);
  if (roles.rowCount !== uniqueCodes.length) throw new ApiError(400, "ROLE_NOT_FOUND", "Одна или несколько ролей не существуют или отключены");
}

export async function registerAdminPlatformRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/platform/navigation", async (request) => {
    await requirePermission(request, "platform.admin");
    const [items, groups, roles] = await Promise.all([
      readNavigationItems(),
      query(`SELECT "publicId"::TEXT AS "id", "code", "label", "placement", "sortOrder", "isEnabled" FROM core."tUiNavigationGroup" ORDER BY "sortOrder", "id"`),
      query(`SELECT "code", "name", "isSystemManaged" FROM access."tRole" WHERE "isActive" = TRUE ORDER BY "isSystemManaged" DESC, "code"`),
    ]);
    return {
      items,
      groups: groups.rows,
      roles: roles.rows,
      iconOptions: NAVIGATION_ICON_CODES,
      componentOptions: PAGE_COMPONENT_KEYS,
    };
  });

  app.patch("/api/v1/admin/platform/navigation/items/:itemPublicId", async (request) => {
    const actor = await requirePermission(request, "platform.admin");
    const params = ItemParamsSchema.parse(request.params);
    const input = ItemUpdateSchema.parse(request.body);
    await withTransaction(async (client) => {
      await assertRolesExist([...input.visibilityRoleCodes, ...input.accessRoleCodes], client);
      const item = await client.query<{id: string; code: string}>(`
        UPDATE core."tUiNavigationItem" navigationItem
        SET "groupId" = navigationGroup."id", "label" = $3, "iconCode" = $4,
          "componentKey" = $5, "sortOrder" = $6, "isEnabled" = $7
        FROM core."tUiNavigationGroup" navigationGroup
        WHERE navigationItem."publicId" = $1 AND navigationGroup."code" = $2
        RETURNING navigationItem."id", navigationItem."code"
      `, [params.itemPublicId, input.groupCode, input.label, input.icon, input.componentKey, input.sortOrder, input.isEnabled]);
      const updated = item.rows[0];
      if (!updated) throw new ApiError(404, "NAVIGATION_ITEM_NOT_FOUND", "Пункт навигации или группа не найдены");

      await client.query(`DELETE FROM core."tUiNavigationItemRole" WHERE "navigationItemId" = $1`, [updated.id]);
      for (const [accessType, roleCodes] of [["VISIBILITY", input.visibilityRoleCodes], ["ROUTE", input.accessRoleCodes]] as const) {
        if (!roleCodes.length) continue;
        await client.query(`
          INSERT INTO core."tUiNavigationItemRole" ("navigationItemId", "roleId", "accessType")
          SELECT $1, "id", $3 FROM access."tRole" WHERE "code" = ANY($2::VARCHAR[])
        `, [updated.id, [...new Set(roleCodes)], accessType]);
      }
      await writeAuditEvent({
        categoryCode: "GOVERNANCE", serviceCode: "core", actionCode: "admin.ui.navigation.item.update",
        actorAccountId: actor.accountId, actorSessionId: actor.sessionId,
        details: {itemCode: updated.code, ...input},
      }, client);
    });
    return {ok: true};
  });

  app.patch("/api/v1/admin/platform/navigation/groups/:groupPublicId", async (request) => {
    const actor = await requirePermission(request, "platform.admin");
    const params = GroupParamsSchema.parse(request.params);
    const input = GroupUpdateSchema.parse(request.body);
    await withTransaction(async (client) => {
      const group = await client.query<{code: string}>(`
        UPDATE core."tUiNavigationGroup"
        SET "label" = $2, "sortOrder" = $3, "isEnabled" = $4
        WHERE "publicId" = $1 RETURNING "code"
      `, [params.groupPublicId, input.label || null, input.sortOrder, input.isEnabled]);
      const updated = group.rows[0];
      if (!updated) throw new ApiError(404, "NAVIGATION_GROUP_NOT_FOUND", "Группа навигации не найдена");
      await writeAuditEvent({
        categoryCode: "GOVERNANCE", serviceCode: "core", actionCode: "admin.ui.navigation.group.update",
        actorAccountId: actor.accountId, actorSessionId: actor.sessionId,
        details: {groupCode: updated.code, ...input},
      }, client);
    });
    return {ok: true};
  });
}
