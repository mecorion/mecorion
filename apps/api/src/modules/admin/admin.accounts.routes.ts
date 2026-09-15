import type {FastifyInstance, FastifyRequest} from "fastify";
import {z} from "zod";
import {config} from "../../core/config.js";
import {query, withTransaction} from "../../core/database.js";
import {ApiError} from "../../core/http/api-error.js";
import {requirePermission} from "../../core/http/auth-context.js";
import {createRecoverySeed} from "../auth/auth.crypto.js";
import {createAccount, normalizeEmail, normalizeUsername} from "../auth/auth.repository.js";

const RoleCodeSchema = z.enum(["BASE", "AGENT", "KEEPER", "MODERATOR", "SPONSOR", "DEVELOPER", "ADMIN", "OWNER"]);
const AccountStatusSchema = z.enum(["PENDING", "ACTIVE", "FROZEN", "BANNED", "DELETION_PENDING", "ANONYMIZED", "CLOSED"]);

const AdminAccountCreateSchema = z.object({
  email: z.email().max(254).optional(),
  displayName: z.string().trim().min(1).max(128),
  username: z.string().trim().min(3).max(32).optional(),
  verified: z.boolean().default(true),
  roles: z.array(RoleCodeSchema).default(["BASE"]),
  createSeedPhrase: z.boolean().default(false),
  seedWordCount: z.union([z.literal(12), z.literal(24)]).default(12),
});

const AccountStatusUpdateSchema = z.object({
  status: AccountStatusSchema,
  reasonCode: z.string().trim().min(2).max(64).default("ADMIN_CHANGE"),
});

const AssignRolesSchema = z.object({
  roles: z.array(RoleCodeSchema).min(1),
});

async function requireAdminOrBootstrap(request: FastifyRequest) {
  const bootstrapToken = request.headers["x-mecorion-bootstrap-token"];
  if (config.ADMIN_BOOTSTRAP_TOKEN && bootstrapToken === config.ADMIN_BOOTSTRAP_TOKEN) {
    return null;
  }

  return requirePermission(request, "platform.admin");
}

export async function registerAdminAccountRoutes(app: FastifyInstance) {
  app.get("/api/v1/admin/accounts", async (request) => {
    await requirePermission(request, "platform.admin");
    const result = await query(`
      SELECT
        account."publicId"::TEXT AS "id",
        profile."username"::TEXT AS "username",
        profile."displayName" AS "displayName",
        emailIdentity."displayValue" AS "email",
        status."code" AS "status",
        account."registerDtm" AS "registerDtm",
        COALESCE(array_agg(DISTINCT role."code") FILTER (WHERE role."code" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "roles"
      FROM account."tAccount" account
      JOIN account."tAccountStatus" status ON status."id" = account."accountStatusId"
      JOIN account."tProfile" profile ON profile."accountId" = account."id"
      LEFT JOIN auth."tIdentity" emailIdentity
        ON emailIdentity."accountId" = account."id"
       AND emailIdentity."isPrimary" = TRUE
       AND emailIdentity."revokeDtm" IS NULL
       AND emailIdentity."identityTypeId" = (SELECT "id" FROM auth."tIdentityType" WHERE "code" = 'EMAIL')
      LEFT JOIN access."tRoleAssignment" assignment
        ON assignment."accountId" = account."id"
       AND assignment."revokeDtm" IS NULL
       AND assignment."roleAssignmentStatusId" = (SELECT "id" FROM access."tRoleAssignmentStatus" WHERE "code" = 'ACTIVE')
      LEFT JOIN access."tRole" role ON role."id" = assignment."roleId"
      GROUP BY account."publicId", profile."username", profile."displayName", emailIdentity."displayValue", status."code", account."registerDtm"
      ORDER BY account."registerDtm" DESC
      LIMIT 200
    `);
    return {items: result.rows};
  });

  app.post("/api/v1/admin/accounts", async (request, reply) => {
    const actor = await requireAdminOrBootstrap(request);
    const input = AdminAccountCreateSchema.parse(request.body);
    const seedPhrase = input.createSeedPhrase ? createRecoverySeed(input.seedWordCount) : null;
    const account = await createAccount({
      displayName: input.displayName.trim(),
      usernameBase: normalizeUsername(input.username ?? input.displayName),
      email: input.email ? normalizeEmail(input.email) : null,
      emailVerified: input.verified,
      statusCode: input.verified ? "ACTIVE" : "PENDING",
      roles: input.roles,
      seedPhrase,
      actorAccountId: actor?.accountId ?? null,
    });

    return reply.status(201).send({
      id: account.accountPublicId,
      username: account.username,
      ...(seedPhrase ? {seedPhrase} : {}),
    });
  });

  app.patch("/api/v1/admin/accounts/:accountPublicId/status", async (request) => {
    const actor = await requirePermission(request, "platform.admin");
    const params = z.object({accountPublicId: z.uuid()}).parse(request.params);
    const input = AccountStatusUpdateSchema.parse(request.body);

    await withTransaction(async (client) => {
      const result = await client.query<{id: string}>(`
        UPDATE account."tAccount"
        SET "accountStatusId" = (SELECT "id" FROM account."tAccountStatus" WHERE "code" = $2),
            "statusChangeDtm" = CURRENT_TIMESTAMP
        WHERE "publicId" = $1
        RETURNING "id"
      `, [params.accountPublicId, input.status]);
      const account = result.rows[0];
      if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");

      await client.query(`
        INSERT INTO account."tAccountStatusHistory" (
          "accountId", "accountStatusId", "reasonCode", "changedByAccountId"
        )
        SELECT $1, "id", $3, $4 FROM account."tAccountStatus" WHERE "code" = $2
      `, [account.id, input.status, input.reasonCode, actor.accountId]);

      if (["FROZEN", "BANNED", "DELETION_PENDING", "ANONYMIZED", "CLOSED"].includes(input.status)) {
        await client.query(`
          UPDATE auth."tSession"
          SET "sessionStatusId" = (SELECT "id" FROM auth."tSessionStatus" WHERE "code" = 'REVOKED'),
              "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP),
              "revokeReasonCode" = COALESCE("revokeReasonCode", $2),
              "revokeByAccountId" = COALESCE("revokeByAccountId", $3)
          WHERE "accountId" = $1
            AND "revokeDtm" IS NULL
        `, [account.id, input.reasonCode, actor.accountId]);
      }
    });

    return {ok: true};
  });

  app.post("/api/v1/admin/accounts/:accountPublicId/roles", async (request) => {
    const actor = await requirePermission(request, "role.assign");
    const params = z.object({accountPublicId: z.uuid()}).parse(request.params);
    const input = AssignRolesSchema.parse(request.body);
    await withTransaction(async (client) => {
      const account = await client.query<{id: string}>(`
        SELECT "id" FROM account."tAccount" WHERE "publicId" = $1
      `, [params.accountPublicId]);
      const target = account.rows[0];
      if (!target) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");

      for (const roleCode of input.roles) {
        await client.query(`
          INSERT INTO access."tRoleAssignment" (
            "accountId", "roleId", "scopeId", "roleAssignmentStatusId", "assignByAccountId"
          )
          SELECT $1, role."id", scope."id", status."id", $3
          FROM access."tRole" role
          CROSS JOIN access."tScope" scope
          CROSS JOIN access."tRoleAssignmentStatus" status
          WHERE role."code" = $2
            AND scope."code" = 'global'
            AND status."code" = 'ACTIVE'
          ON CONFLICT ("accountId", "roleId", "scopeId") WHERE "revokeDtm" IS NULL DO NOTHING
        `, [target.id, roleCode, actor.accountId]);
      }
    });
    return {ok: true};
  });
}
