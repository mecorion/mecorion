import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {query, withTransaction} from "../../core/database.js";
import {writeAuditEvent} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";

const RoleCodeSchema = z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,63}$/);
const PermissionCodeSchema = z.string().trim().regex(/^[a-z][a-z0-9.]{2,127}$/);
const RoleBodySchema = z.object({
  roleTypeCode: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,31}$/).default("SYSTEM"),
  code: RoleCodeSchema,
  name: z.string().trim().min(2).max(128),
  description: z.string().trim().max(512).nullable().default(null),
  requiresGovernanceIdentity: z.boolean().default(false),
  isActive: z.boolean().default(true),
  permissionCodes: z.array(PermissionCodeSchema).default([]),
});

export async function registerAdminAccessRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/roles", async (request) => {
    await requirePermission(request, "platform.admin");
    const [roles, roleTypes] = await Promise.all([
      query(`
        SELECT role."publicId"::TEXT AS "id", role."code", role."name", role."description",
          roleType."code" AS "roleType", role."requiresGovernanceIdentity", role."isSystemManaged", role."isActive",
          COUNT(DISTINCT assignment."id") FILTER (WHERE assignment."revokeDtm" IS NULL)::INTEGER AS "assignmentCount",
          COALESCE(array_agg(DISTINCT permission."code") FILTER (WHERE permission."code" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "permissions"
        FROM access."tRole" role
        JOIN access."tRoleType" roleType ON roleType."id" = role."roleTypeId"
        LEFT JOIN access."tRolePermission" rolePermission ON rolePermission."roleId" = role."id"
        LEFT JOIN access."tPermission" permission ON permission."id" = rolePermission."permissionId"
        LEFT JOIN access."tRoleAssignment" assignment ON assignment."roleId" = role."id"
        GROUP BY role."id", roleType."code" ORDER BY role."isSystemManaged" DESC, role."code"
      `),
      query(`SELECT "code", "name" FROM access."tRoleType" ORDER BY "id"`),
    ]);
    return {items: roles.rows, roleTypes: roleTypes.rows};
  });

  app.get("/api/v1/admin/permissions", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`
      SELECT permission."publicId"::TEXT AS "id", permission."code", permission."name", permission."description",
        permission."isActive", service."code" AS "serviceCode", service."name" AS "serviceName"
      FROM access."tPermission" permission
      JOIN core."tService" service ON service."id" = permission."serviceId"
      ORDER BY service."code", permission."code"
    `);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/roles", async (request, reply) => {
    const actor = await requirePermission(request, "role.assign");
    const input = RoleBodySchema.parse(request.body);
    const role = await withTransaction(async (client) => {
      const result = await client.query<{id: string; publicId: string}>(`
        INSERT INTO access."tRole" ("roleTypeId", "code", "name", "description", "requiresGovernanceIdentity", "isSystemManaged", "isActive")
        SELECT roleType."id", $2, $3, $4, $5, FALSE, $6 FROM access."tRoleType" roleType WHERE roleType."code" = $1
        RETURNING "id", "publicId"::TEXT AS "publicId"
      `, [input.roleTypeCode, input.code, input.name, input.description, input.requiresGovernanceIdentity, input.isActive]);
      const created = result.rows[0];
      if (!created) throw new ApiError(400, "ROLE_TYPE_NOT_FOUND", "Тип роли не найден");
      if (input.permissionCodes.length) {
        const permissions = await client.query(`INSERT INTO access."tRolePermission" ("roleId", "permissionId") SELECT $1, "id" FROM access."tPermission" WHERE "code" = ANY($2::VARCHAR[])`, [created.id, input.permissionCodes]);
        if (permissions.rowCount !== new Set(input.permissionCodes).size) throw new ApiError(400, "PERMISSION_NOT_FOUND", "Одно или несколько разрешений не найдены");
      }
      await writeAuditEvent({categoryCode: "GOVERNANCE", serviceCode: "access", actionCode: "admin.role.create", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, details: {roleCode: input.code, permissionCodes: input.permissionCodes}}, client);
      return created;
    });
    return reply.status(201).send({id: role.publicId});
  });

  app.patch("/api/v1/admin/roles/:rolePublicId", async (request) => {
    const actor = await requirePermission(request, "role.assign");
    const params = z.object({rolePublicId: z.uuid()}).parse(request.params);
    const input = RoleBodySchema.omit({code: true, roleTypeCode: true}).parse(request.body);
    await withTransaction(async (client) => {
      const result = await client.query<{id: string; code: string}>(`
        UPDATE access."tRole" SET "name" = $2, "description" = $3, "requiresGovernanceIdentity" = $4,
          "isActive" = $5, "updateDtm" = CURRENT_TIMESTAMP
        WHERE "publicId" = $1 AND "isSystemManaged" = FALSE RETURNING "id", "code"
      `, [params.rolePublicId, input.name, input.description, input.requiresGovernanceIdentity, input.isActive]);
      const role = result.rows[0];
      if (!role) throw new ApiError(404, "CUSTOM_ROLE_NOT_FOUND", "Изменять можно только пользовательские роли");
      await client.query(`DELETE FROM access."tRolePermission" WHERE "roleId" = $1`, [role.id]);
      if (input.permissionCodes.length) {
        const permissions = await client.query(`INSERT INTO access."tRolePermission" ("roleId", "permissionId") SELECT $1, "id" FROM access."tPermission" WHERE "code" = ANY($2::VARCHAR[])`, [role.id, input.permissionCodes]);
        if (permissions.rowCount !== new Set(input.permissionCodes).size) throw new ApiError(400, "PERMISSION_NOT_FOUND", "Одно или несколько разрешений не найдены");
      }
      await writeAuditEvent({categoryCode: "GOVERNANCE", serviceCode: "access", actionCode: "admin.role.update", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, details: {roleCode: role.code, permissionCodes: input.permissionCodes}}, client);
    });
    return {ok: true};
  });
}
