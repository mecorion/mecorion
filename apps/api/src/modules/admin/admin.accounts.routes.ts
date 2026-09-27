import type {FastifyInstance, FastifyRequest} from "fastify";
import {z} from "zod";
import {config} from "../../core/config.js";
import {query, withTransaction, type DatabaseClient} from "../../core/database.js";
import {writeAuditEvent} from "../../core/db-helpers.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";
import {createRecoverySeed} from "../auth/auth.crypto.js";
import {createAccount, normalizeEmail, normalizeUsername} from "../auth/auth.repository.js";

const RoleCodeSchema = z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,63}$/);
const AccountStatusSchema = z.enum(["PENDING", "ACTIVE", "FROZEN", "BANNED", "DELETION_PENDING", "ANONYMIZED", "CLOSED"]);
const AccountParamsSchema = z.object({accountPublicId: z.uuid()});

const AccountsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(128).default(""),
  status: AccountStatusSchema.optional(),
  role: RoleCodeSchema.optional(),
});

const AdminAccountCreateSchema = z.object({
  email: z.email().max(254).optional(),
  displayName: z.string().trim().min(1).max(128),
  username: z.string().trim().min(3).max(32).optional(),
  verified: z.boolean().default(true),
  roles: z.array(RoleCodeSchema).default(["BASE"]),
  createSeedPhrase: z.boolean().default(false),
  seedWordCount: z.union([z.literal(12), z.literal(24)]).default(12),
});

const ProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(128),
  username: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/),
  bio: z.string().trim().max(1024).nullable().default(null),
  isDiscoverable: z.boolean().default(true),
});

const AccountStatusUpdateSchema = z.object({
  status: AccountStatusSchema,
  reasonCode: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,63}$/).default("ADMIN_CHANGE"),
});
const AssignRolesSchema = z.object({roles: z.array(RoleCodeSchema).min(1)});
const RoleParamsSchema = AccountParamsSchema.extend({roleCode: RoleCodeSchema});
const SessionParamsSchema = AccountParamsSchema.extend({sessionPublicId: z.uuid()});

async function requireAdminOrBootstrap(request: FastifyRequest) {
  const bootstrapToken = request.headers["x-mecorion-bootstrap-token"];
  if (config.ADMIN_BOOTSTRAP_TOKEN && bootstrapToken === config.ADMIN_BOOTSTRAP_TOKEN) return null;
  return requirePermission(request, "platform.admin");
}

async function findAccount(accountPublicId: string, client: DatabaseClient = {query}) {
  const result = await client.query<{id: string; resourceId: string}>(`
    SELECT account."id", profile."resourceId"
    FROM account."tAccount" account
    JOIN account."tProfile" profile ON profile."accountId" = account."id"
    WHERE account."publicId" = $1
  `, [accountPublicId]);
  const account = result.rows[0];
  if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");
  return account;
}

export async function registerAdminAccountRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/access", async (request) => {
    const context = await requireAdminOrBootstrap(request);
    if (!context) throw new ApiError(401, "ADMIN_SESSION_REQUIRED", "Для панели администратора нужна пользовательская сессия");
    return {allowed: true, user: {id: context.accountPublicId, username: context.username, displayName: context.displayName, email: context.email, roles: context.roles, permissions: context.permissions}};
  });

  app.get("/api/v1/admin/account-statuses", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`SELECT "code", "name", "isLoginAllowed" FROM account."tAccountStatus" ORDER BY "id"`);
    return {items: result.rows};
  });

  app.get("/api/v1/admin/accounts", async (request) => {
    await requirePermission(request, "platform.admin");
    const input = AccountsQuerySchema.parse(request.query);
    const values: unknown[] = [];
    const where: string[] = [];
    if (input.search) {
      values.push(`%${input.search}%`);
      where.push(`(profile."username" ILIKE $${values.length} OR profile."displayName" ILIKE $${values.length} OR emailIdentity."displayValue" ILIKE $${values.length})`);
    }
    if (input.status) {
      values.push(input.status);
      where.push(`status."code" = $${values.length}`);
    }
    if (input.role) {
      values.push(input.role);
      where.push(`EXISTS (SELECT 1 FROM access."tRoleAssignment" roleFilter JOIN access."tRole" filteredRole ON filteredRole."id" = roleFilter."roleId" WHERE roleFilter."accountId" = account."id" AND roleFilter."revokeDtm" IS NULL AND filteredRole."code" = $${values.length})`);
    }
    const filterSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const identityJoin = `LEFT JOIN auth."tIdentity" emailIdentity ON emailIdentity."accountId" = account."id" AND emailIdentity."isPrimary" = TRUE AND emailIdentity."revokeDtm" IS NULL AND emailIdentity."identityTypeId" = (SELECT "id" FROM auth."tIdentityType" WHERE "code" = 'EMAIL')`;
    const countResult = await query<{total: string}>(`
      SELECT COUNT(DISTINCT account."id")::TEXT AS "total"
      FROM account."tAccount" account
      JOIN account."tAccountStatus" status ON status."id" = account."accountStatusId"
      JOIN account."tProfile" profile ON profile."accountId" = account."id"
      ${identityJoin} ${filterSql}
    `, values);
    const offset = (input.page - 1) * input.pageSize;
    const result = await query(`
      SELECT account."publicId"::TEXT AS "id", profile."username"::TEXT AS "username", profile."displayName" AS "displayName",
        emailIdentity."displayValue" AS "email", status."code" AS "status", account."registerDtm" AS "registerDtm",
        COALESCE(array_agg(DISTINCT role."code") FILTER (WHERE role."code" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "roles"
      FROM account."tAccount" account
      JOIN account."tAccountStatus" status ON status."id" = account."accountStatusId"
      JOIN account."tProfile" profile ON profile."accountId" = account."id"
      ${identityJoin}
      LEFT JOIN access."tRoleAssignment" assignment ON assignment."accountId" = account."id" AND assignment."revokeDtm" IS NULL
      LEFT JOIN access."tRole" role ON role."id" = assignment."roleId"
      ${filterSql}
      GROUP BY account."id", account."publicId", profile."username", profile."displayName", emailIdentity."displayValue", status."code", account."registerDtm"
      ORDER BY account."registerDtm" DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `, [...values, input.pageSize, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return {items: result.rows, pagination: {page: input.page, pageSize: input.pageSize, total, pages: Math.ceil(total / input.pageSize)}};
  });

  app.get("/api/v1/admin/accounts/:accountPublicId", async (request) => {
    await requirePermission(request, "platform.admin");
    const params = AccountParamsSchema.parse(request.params);
    const account = await query(`
      SELECT account."publicId"::TEXT AS "id", profile."resourceId"::TEXT AS "resourceId", profile."username"::TEXT AS "username",
        profile."displayName", profile."bio", profile."isDiscoverable", emailIdentity."displayValue" AS "email",
        emailIdentity."isVerified" AS "emailVerified", status."code" AS "status", status."name" AS "statusName",
        account."registerDtm", account."statusChangeDtm"
      FROM account."tAccount" account
      JOIN account."tAccountStatus" status ON status."id" = account."accountStatusId"
      JOIN account."tProfile" profile ON profile."accountId" = account."id"
      LEFT JOIN auth."tIdentity" emailIdentity ON emailIdentity."accountId" = account."id" AND emailIdentity."isPrimary" = TRUE AND emailIdentity."revokeDtm" IS NULL AND emailIdentity."identityTypeId" = (SELECT "id" FROM auth."tIdentityType" WHERE "code" = 'EMAIL')
      WHERE account."publicId" = $1
    `, [params.accountPublicId]);
    if (!account.rows[0]) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");
    const [roles, history, sessions] = await Promise.all([
      query(`SELECT assignment."publicId"::TEXT AS "assignmentId", role."publicId"::TEXT AS "id", role."code", role."name", scope."code" AS "scope", assignment."assignDtm" FROM access."tRoleAssignment" assignment JOIN account."tAccount" account ON account."id" = assignment."accountId" JOIN access."tRole" role ON role."id" = assignment."roleId" JOIN access."tScope" scope ON scope."id" = assignment."scopeId" WHERE account."publicId" = $1 AND assignment."revokeDtm" IS NULL ORDER BY role."code"`, [params.accountPublicId]),
      query(`SELECT status."code", status."name", history."reasonCode", history."changeDtm", actorProfile."displayName" AS "changedBy" FROM account."tAccountStatusHistory" history JOIN account."tAccount" account ON account."id" = history."accountId" JOIN account."tAccountStatus" status ON status."id" = history."accountStatusId" LEFT JOIN account."tProfile" actorProfile ON actorProfile."accountId" = history."changedByAccountId" WHERE account."publicId" = $1 ORDER BY history."changeDtm" DESC LIMIT 50`, [params.accountPublicId]),
      query(`SELECT session."publicId"::TEXT AS "id", status."code" AS "status", device."name" AS "deviceName", device."platformCode", session."riskLevel", session."createDtm", session."lastSeenDtm", session."absoluteExpireDtm", session."revokeDtm", session."revokeReasonCode" FROM auth."tSession" session JOIN account."tAccount" account ON account."id" = session."accountId" JOIN auth."tSessionStatus" status ON status."id" = session."sessionStatusId" LEFT JOIN auth."tDevice" device ON device."id" = session."deviceId" WHERE account."publicId" = $1 ORDER BY session."lastSeenDtm" DESC LIMIT 50`, [params.accountPublicId]),
    ]);
    return {...account.rows[0], roles: roles.rows, statusHistory: history.rows, sessions: sessions.rows};
  });

  app.post("/api/v1/admin/accounts", async (request, reply) => {
    const actor = await requireAdminOrBootstrap(request);
    const input = AdminAccountCreateSchema.parse(request.body);
    const seedPhrase = input.createSeedPhrase ? createRecoverySeed(input.seedWordCount) : null;
    const account = await createAccount({displayName: input.displayName, usernameBase: normalizeUsername(input.username ?? input.displayName), email: input.email ? normalizeEmail(input.email) : null, emailVerified: input.verified, statusCode: input.verified ? "ACTIVE" : "PENDING", roles: input.roles, seedPhrase, actorAccountId: actor?.accountId ?? null});
    return reply.status(201).send({id: account.accountPublicId, username: account.username, ...(seedPhrase ? {seedPhrase} : {})});
  });

  app.patch("/api/v1/admin/accounts/:accountPublicId/profile", async (request) => {
    const actor = await requirePermission(request, "platform.admin");
    const params = AccountParamsSchema.parse(request.params);
    const input = ProfileUpdateSchema.parse(request.body);
    await withTransaction(async (client) => {
      const result = await client.query<{resourceId: string}>(`UPDATE account."tProfile" profile SET "displayName" = $2, "username" = $3, "bio" = $4, "isDiscoverable" = $5, "updateDtm" = CURRENT_TIMESTAMP FROM account."tAccount" account WHERE profile."accountId" = account."id" AND account."publicId" = $1 RETURNING profile."resourceId"`, [params.accountPublicId, input.displayName, input.username, input.bio || null, input.isDiscoverable]);
      const profile = result.rows[0];
      if (!profile) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");
      await writeAuditEvent({categoryCode: "ACCOUNT", serviceCode: "account", actionCode: "admin.account.profile.update", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, targetResourceId: profile.resourceId, details: {accountPublicId: params.accountPublicId}}, client);
    });
    return {ok: true};
  });

  app.patch("/api/v1/admin/accounts/:accountPublicId/status", async (request) => {
    const actor = await requirePermission(request, "platform.admin");
    const params = AccountParamsSchema.parse(request.params);
    const input = AccountStatusUpdateSchema.parse(request.body);
    await withTransaction(async (client) => {
      const result = await client.query<{id: string; resourceId: string}>(`UPDATE account."tAccount" account SET "accountStatusId" = (SELECT "id" FROM account."tAccountStatus" WHERE "code" = $2), "statusChangeDtm" = CURRENT_TIMESTAMP FROM account."tProfile" profile WHERE account."publicId" = $1 AND profile."accountId" = account."id" RETURNING account."id", profile."resourceId"`, [params.accountPublicId, input.status]);
      const account = result.rows[0];
      if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");
      await client.query(`INSERT INTO account."tAccountStatusHistory" ("accountId", "accountStatusId", "reasonCode", "changedByAccountId") SELECT $1, "id", $3, $4 FROM account."tAccountStatus" WHERE "code" = $2`, [account.id, input.status, input.reasonCode, actor.accountId]);
      if (["FROZEN", "BANNED", "DELETION_PENDING", "ANONYMIZED", "CLOSED"].includes(input.status)) {
        await client.query(`UPDATE auth."tSession" SET "sessionStatusId" = (SELECT "id" FROM auth."tSessionStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP), "revokeReasonCode" = COALESCE("revokeReasonCode", $2), "revokeByAccountId" = COALESCE("revokeByAccountId", $3) WHERE "accountId" = $1 AND "revokeDtm" IS NULL`, [account.id, input.reasonCode, actor.accountId]);
        await client.query(`UPDATE auth."tRefreshToken" token SET "refreshTokenStatusId" = (SELECT "id" FROM auth."tRefreshTokenStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = COALESCE(token."revokeDtm", CURRENT_TIMESTAMP) FROM auth."tSession" session WHERE token."sessionId" = session."id" AND session."accountId" = $1 AND token."revokeDtm" IS NULL`, [account.id]);
      }
      await writeAuditEvent({categoryCode: "ACCOUNT", serviceCode: "account", actionCode: "admin.account.status.update", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, targetResourceId: account.resourceId, details: {accountPublicId: params.accountPublicId, status: input.status, reasonCode: input.reasonCode}}, client);
    });
    return {ok: true};
  });

  app.post("/api/v1/admin/accounts/:accountPublicId/roles", async (request) => {
    const actor = await requirePermission(request, "role.assign");
    const params = AccountParamsSchema.parse(request.params);
    const input = AssignRolesSchema.parse(request.body);
    await withTransaction(async (client) => {
      const target = await findAccount(params.accountPublicId, client);
      for (const roleCode of input.roles) {
        const role = await client.query<{id: string}>(`SELECT "id" FROM access."tRole" WHERE "code" = $1 AND "isActive" = TRUE`, [roleCode]);
        if (!role.rows[0]) throw new ApiError(400, "ROLE_NOT_FOUND", `Роль ${roleCode} не найдена`);
        await client.query(`INSERT INTO access."tRoleAssignment" ("accountId", "roleId", "scopeId", "roleAssignmentStatusId", "assignByAccountId") SELECT $1, $2, scope."id", status."id", $3 FROM access."tScope" scope CROSS JOIN access."tRoleAssignmentStatus" status WHERE scope."code" = 'global' AND status."code" = 'ACTIVE' ON CONFLICT ("accountId", "roleId", "scopeId") WHERE "revokeDtm" IS NULL DO NOTHING`, [target.id, role.rows[0].id, actor.accountId]);
      }
      await writeAuditEvent({categoryCode: "GOVERNANCE", serviceCode: "access", actionCode: "admin.account.role.assign", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, targetResourceId: target.resourceId, details: {accountPublicId: params.accountPublicId, roles: input.roles}}, client);
    });
    return {ok: true};
  });

  app.delete("/api/v1/admin/accounts/:accountPublicId/roles/:roleCode", async (request) => {
    const actor = await requirePermission(request, "role.assign");
    const params = RoleParamsSchema.parse(request.params);
    if (params.accountPublicId === actor.accountPublicId && params.roleCode === "ADMIN") throw new ApiError(409, "SELF_ADMIN_REVOKE_DENIED", "Нельзя снять роль ADMIN с текущей сессии");
    await withTransaction(async (client) => {
      const target = await findAccount(params.accountPublicId, client);
      const result = await client.query(`UPDATE access."tRoleAssignment" assignment SET "roleAssignmentStatusId" = (SELECT "id" FROM access."tRoleAssignmentStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = CURRENT_TIMESTAMP, "revokeByAccountId" = $3, "revokeReasonCode" = 'ADMIN_REVOKE' FROM access."tRole" role WHERE assignment."accountId" = $1 AND assignment."roleId" = role."id" AND role."code" = $2 AND assignment."revokeDtm" IS NULL`, [target.id, params.roleCode, actor.accountId]);
      if (!result.rowCount) throw new ApiError(404, "ROLE_ASSIGNMENT_NOT_FOUND", "Активное назначение роли не найдено");
      await writeAuditEvent({categoryCode: "GOVERNANCE", serviceCode: "access", actionCode: "admin.account.role.revoke", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, targetResourceId: target.resourceId, details: {accountPublicId: params.accountPublicId, role: params.roleCode}}, client);
    });
    return {ok: true};
  });

  app.delete("/api/v1/admin/accounts/:accountPublicId/sessions/:sessionPublicId", async (request) => {
    const actor = await requirePermission(request, "platform.admin");
    const params = SessionParamsSchema.parse(request.params);
    if (params.sessionPublicId === actor.sessionPublicId) throw new ApiError(409, "CURRENT_SESSION_REVOKE_DENIED", "Текущую сессию завершите через выход из панели");
    await withTransaction(async (client) => {
      const target = await findAccount(params.accountPublicId, client);
      const session = await client.query<{id: string}>(`UPDATE auth."tSession" session SET "sessionStatusId" = (SELECT "id" FROM auth."tSessionStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = CURRENT_TIMESTAMP, "revokeReasonCode" = 'ADMIN_REVOKE', "revokeByAccountId" = $3 FROM account."tAccount" account WHERE session."publicId" = $1 AND account."publicId" = $2 AND session."accountId" = account."id" AND session."revokeDtm" IS NULL RETURNING session."id"`, [params.sessionPublicId, params.accountPublicId, actor.accountId]);
      if (!session.rows[0]) throw new ApiError(404, "SESSION_NOT_FOUND", "Активная сессия не найдена");
      await client.query(`UPDATE auth."tRefreshToken" SET "refreshTokenStatusId" = (SELECT "id" FROM auth."tRefreshTokenStatus" WHERE "code" = 'REVOKED'), "revokeDtm" = CURRENT_TIMESTAMP WHERE "sessionId" = $1 AND "revokeDtm" IS NULL`, [session.rows[0].id]);
      await writeAuditEvent({categoryCode: "AUTH", serviceCode: "auth", actionCode: "admin.session.revoke", actorAccountId: actor.accountId, actorSessionId: actor.sessionId, targetResourceId: target.resourceId, details: {accountPublicId: params.accountPublicId, sessionPublicId: params.sessionPublicId}}, client);
    });
    return {ok: true};
  });
}
