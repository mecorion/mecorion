import {randomUUID} from "node:crypto";
import type {DatabaseClient} from "../../core/database.js";
import {query, withTransaction} from "../../core/database.js";
import type {AuthContext} from "../../core/http/auth-context.js";
import {ApiError} from "../../core/http/api-error.js";
import {config} from "../../core/config.js";
import type {AccessTokenPayload} from "./auth.tokens.js";
import {createAccessToken} from "./auth.tokens.js";
import {createOpaqueToken, hashSecret, sha256Buffer, verifySecret} from "./auth.crypto.js";

export interface PublicAccount {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (normalized.length >= 3) return normalized.slice(0, 24);
  return `user-${normalized || "new"}`.slice(0, 24);
}

async function lookupId(client: DatabaseClient, table: string, code: string) {
  const result = await client.query<{id: string}>(`SELECT "id" FROM ${table} WHERE "code" = $1`, [code]);
  const row = result.rows[0];
  if (!row) throw new Error(`Reference ${table}.${code} was not found. Run database seeds first.`);
  return row.id;
}

async function createResource(client: DatabaseClient, resourceTypeCode: string) {
  const result = await client.query<{id: string; publicId: string}>(`
    INSERT INTO core."tResource" ("resourceTypeId")
    SELECT "id" FROM core."tResourceType" WHERE "code" = $1
    RETURNING "id", "publicId"::TEXT AS "publicId"
  `, [resourceTypeCode]);
  const row = result.rows[0];
  if (!row) throw new Error(`Resource type ${resourceTypeCode} was not found.`);
  return row;
}

async function createUniqueProfile(
  client: DatabaseClient,
  input: {accountId: string; displayName: string; usernameBase: string},
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${Math.floor(Math.random() * 9000) + 1000}`;
    const username = `${input.usernameBase}${suffix}`.slice(0, 32);
    const existing = await client.query(`SELECT 1 FROM account."tProfile" WHERE "username" = $1`, [username]);
    if (existing.rowCount === 0) {
      const profileResource = await createResource(client, "profile");
      await client.query(`
          INSERT INTO account."tProfile" ("accountId", "resourceId", "username", "displayName")
          VALUES ($1, $2, $3, $4)
        `, [input.accountId, profileResource.id, username, input.displayName]);
      return username;
    }
  }

  throw new Error("Не удалось подобрать уникальный username");
}

async function grantRole(
  client: DatabaseClient,
  input: {accountId: string; roleCode: string; assignByAccountId?: string | null},
) {
  await client.query(`
    INSERT INTO access."tRoleAssignment" (
      "accountId", "roleId", "scopeId", "roleAssignmentStatusId", "assignByAccountId"
    )
    SELECT $1, role."id", scope."id", status."id", $2
    FROM access."tRole" role
    CROSS JOIN access."tScope" scope
    CROSS JOIN access."tRoleAssignmentStatus" status
    WHERE role."code" = $3
      AND scope."code" = 'global'
      AND status."code" = 'ACTIVE'
    ON CONFLICT ("accountId", "roleId", "scopeId") WHERE "revokeDtm" IS NULL DO NOTHING
  `, [input.accountId, input.assignByAccountId ?? null, input.roleCode]);
}

async function createGovernanceEligibility(client: DatabaseClient, accountId: string) {
  const verifiedStatusId = await lookupId(client, 'account."tPersonAnchorStatus"', "VERIFIED");
  const eligibleStatusId = await lookupId(client, 'account."tGovernanceEligibilityStatus"', "ELIGIBLE");
  const person = await client.query<{id: string}>(`
    INSERT INTO account."tPersonAnchor" ("personAnchorStatusId", "verificationLevel", "verifiedDtm")
    VALUES ($1, 10, CURRENT_TIMESTAMP)
    RETURNING "id"
  `, [verifiedStatusId]);
  const personAnchorId = person.rows[0]?.id;
  if (!personAnchorId) throw new Error("Не удалось создать person anchor");

  await client.query(`
    INSERT INTO account."tAccountPerson" ("accountId", "personAnchorId", "linkType")
    VALUES ($1, $2, 'PRIMARY')
  `, [accountId, personAnchorId]);

  await client.query(`
    INSERT INTO account."tGovernanceEligibility" (
      "personAnchorId", "accountId", "governanceEligibilityStatusId", "grantDtm", "reviewRequired"
    )
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, FALSE)
  `, [personAnchorId, accountId, eligibleStatusId]);
}

export async function findAccountByEmail(email: string, client: DatabaseClient = {query}) {
  const result = await client.query<{
    accountId: string;
    accountPublicId: string;
    identityId: string;
    isVerified: boolean;
    status: string;
    isLoginAllowed: boolean;
  }>(`
    SELECT
      account."id" AS "accountId",
      account."publicId"::TEXT AS "accountPublicId",
      identity."id" AS "identityId",
      identity."isVerified" AS "isVerified",
      status."code" AS "status",
      status."isLoginAllowed" AS "isLoginAllowed"
    FROM auth."tIdentity" identity
    JOIN auth."tIdentityType" identityType ON identityType."id" = identity."identityTypeId"
    JOIN account."tAccount" account ON account."id" = identity."accountId"
    JOIN account."tAccountStatus" status ON status."id" = account."accountStatusId"
    WHERE identityType."code" = 'EMAIL'
      AND identity."normalizedValue" = $1
      AND identity."revokeDtm" IS NULL
  `, [email]);
  return result.rows[0] ?? null;
}

export async function createAccount(input: {
  displayName: string;
  usernameBase: string;
  email?: string | null;
  emailVerified?: boolean;
  statusCode?: "PENDING" | "ACTIVE";
  seedPhrase?: string | null;
  roles?: string[];
  actorAccountId?: string | null;
}) {
  return withTransaction(async (client) => {
    const statusCode = input.statusCode ?? (input.emailVerified ? "ACTIVE" : "PENDING");
    const accountStatusId = await lookupId(client, 'account."tAccountStatus"', statusCode);
    const result = await client.query<{id: string; publicId: string}>(`
      INSERT INTO account."tAccount" ("accountStatusId")
      VALUES ($1)
      RETURNING "id", "publicId"::TEXT AS "publicId"
    `, [accountStatusId]);
    const account = result.rows[0];
    if (!account) throw new Error("Не удалось создать аккаунт");

    const username = await createUniqueProfile(client, {
      accountId: account.id,
      displayName: input.displayName,
      usernameBase: input.usernameBase,
    });

    if (input.email) {
      const identityTypeId = await lookupId(client, 'auth."tIdentityType"', "EMAIL");
      await client.query(`
        INSERT INTO auth."tIdentity" (
          "accountId", "identityTypeId", "normalizedValue", "displayValue", "isPrimary", "isVerified", "verifyDtm"
        )
        VALUES ($1, $2, $3, $4, TRUE, $5, CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE NULL END)
      `, [account.id, identityTypeId, input.email, input.email, input.emailVerified === true]);
    }

    if (input.seedPhrase) {
      const credentialTypeId = await lookupId(client, 'auth."tCredentialType"', "RECOVERY_SEED");
      await client.query(`
        INSERT INTO auth."tCredential" (
          "accountId", "credentialTypeId", "credentialIdentifier", "secretHash", "algorithm", "algorithmParameters"
        )
        VALUES ($1, $2, 'bip39', $3, 'SHA256', '{"wordlist":"english"}'::JSONB)
      `, [account.id, credentialTypeId, hashSecret(input.seedPhrase)]);
    }

    await grantRole(client, {accountId: account.id, roleCode: "BASE", assignByAccountId: input.actorAccountId ?? null});

    const requestedRoles = input.roles ?? [];
    if (requestedRoles.some((role) => ["AGENT", "KEEPER", "MODERATOR", "DEVELOPER", "ADMIN", "OWNER"].includes(role))) {
      await createGovernanceEligibility(client, account.id);
    }
    for (const roleCode of requestedRoles) {
      if (roleCode !== "BASE") {
        await grantRole(client, {accountId: account.id, roleCode, assignByAccountId: input.actorAccountId ?? null});
      }
    }

    return {accountId: account.id, accountPublicId: account.publicId, username};
  });
}

export async function getOrCreateEmailAccount(input: {email: string; displayName?: string}) {
  const existing = await findAccountByEmail(input.email);
  if (existing) return existing;

  await createAccount({
    displayName: input.displayName ?? input.email.split("@")[0] ?? "Mecorion User",
    usernameBase: normalizeUsername(input.email.split("@")[0] ?? "user"),
    email: input.email,
    emailVerified: false,
    statusCode: "PENDING",
  });
  const created = await findAccountByEmail(input.email);
  if (!created) throw new Error("Не удалось найти созданный email identity");
  return created;
}

export async function createEmailChallenge(input: {accountId: string; identityId: string; code: string}) {
  const challengeTypeId = await lookupId({query}, 'auth."tChallengeType"', "EMAIL_VERIFY");
  const expireAt = new Date(Date.now() + config.AUTH_CODE_TTL_SECONDS * 1000);
  await query(`
    UPDATE auth."tChallenge"
    SET "consumeDtm" = CURRENT_TIMESTAMP
    WHERE "accountId" = $1
      AND "identityId" = $2
      AND "consumeDtm" IS NULL
  `, [input.accountId, input.identityId]);
  const result = await query<{publicId: string}>(`
    INSERT INTO auth."tChallenge" (
      "accountId", "identityId", "challengeTypeId", "secretHash", "maxAttemptCount", "expireDtm"
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING "publicId"::TEXT AS "publicId"
  `, [input.accountId, input.identityId, challengeTypeId, hashSecret(input.code), config.AUTH_CODE_MAX_ATTEMPTS, expireAt]);
  return result.rows[0]?.publicId;
}

export async function confirmEmailChallenge(input: {email: string; code: string}) {
  return withTransaction(async (client) => {
    const account = await findAccountByEmail(input.email, client);
    if (!account) throw new ApiError(401, "INVALID_CODE", "Код недействителен");

    const result = await client.query<{
      id: string;
      secretHash: Buffer;
    }>(`
      SELECT challenge."id", challenge."secretHash"
      FROM auth."tChallenge" challenge
      JOIN auth."tChallengeType" challengeType ON challengeType."id" = challenge."challengeTypeId"
      WHERE challenge."accountId" = $1
        AND challenge."identityId" = $2
        AND challengeType."code" = 'EMAIL_VERIFY'
        AND challenge."consumeDtm" IS NULL
        AND challenge."expireDtm" > CURRENT_TIMESTAMP
        AND challenge."attemptCount" < challenge."maxAttemptCount"
      ORDER BY challenge."createDtm" DESC
      LIMIT 1
      FOR UPDATE
    `, [account.accountId, account.identityId]);
    const challenge = result.rows[0];
    if (!challenge) throw new ApiError(401, "INVALID_CODE", "Код недействителен или истёк");

    if (!verifySecret(input.code, challenge.secretHash)) {
      await client.query(`
        UPDATE auth."tChallenge"
        SET "attemptCount" = LEAST("attemptCount" + 1, "maxAttemptCount")
        WHERE "id" = $1
      `, [challenge.id]);
      throw new ApiError(401, "INVALID_CODE", "Код недействителен");
    }

    await client.query(`UPDATE auth."tChallenge" SET "consumeDtm" = CURRENT_TIMESTAMP WHERE "id" = $1`, [challenge.id]);
    await client.query(`
      UPDATE auth."tIdentity"
      SET "isVerified" = TRUE, "verifyDtm" = COALESCE("verifyDtm", CURRENT_TIMESTAMP)
      WHERE "id" = $1
    `, [account.identityId]);
    await client.query(`
      UPDATE account."tAccount"
      SET "accountStatusId" = (SELECT "id" FROM account."tAccountStatus" WHERE "code" = 'ACTIVE'),
          "statusChangeDtm" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "accountStatusId" = (SELECT "id" FROM account."tAccountStatus" WHERE "code" = 'PENDING')
    `, [account.accountId]);

    const issued = await issueSessionTokens(client, account.accountId);
    return {...issued, accountInternalId: account.accountId};
  });
}

export async function issueSessionTokens(client: DatabaseClient, accountId: string): Promise<{account: PublicAccount; tokens: AuthTokens}> {
  const sessionStatusId = await lookupId(client, 'auth."tSessionStatus"', "ACTIVE");
  const absoluteExpireAt = new Date(Date.now() + config.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await client.query<{id: string; publicId: string}>(`
    INSERT INTO auth."tSession" ("accountId", "sessionStatusId", "absoluteExpireDtm")
    VALUES ($1, $2, $3)
    RETURNING "id", "publicId"::TEXT AS "publicId"
  `, [accountId, sessionStatusId, absoluteExpireAt]);
  const sessionRow = session.rows[0];
  if (!sessionRow) throw new Error("Не удалось создать сессию");

  const account = await loadPublicAccount(client, accountId, sessionRow.publicId);
  const refreshToken = createOpaqueToken(48);
  await createRefreshToken(client, {
    sessionId: sessionRow.id,
    familyPublicId: randomUUID(),
    rotationNumber: 0,
    token: refreshToken,
    expireAt: absoluteExpireAt,
  });

  return {
    account,
    tokens: {
      accessToken: createAccessToken({
        accountPublicId: account.id,
        sessionPublicId: sessionRow.publicId,
        roles: account.roles,
        permissions: account.permissions,
      }),
      refreshToken,
      tokenType: "Bearer",
      expiresIn: config.JWT_ACCESS_TTL_SECONDS,
    },
  };
}

async function createRefreshToken(
  client: DatabaseClient,
  input: {sessionId: string; familyPublicId: string; rotationNumber: number; token: string; expireAt: Date},
) {
  const statusId = await lookupId(client, 'auth."tRefreshTokenStatus"', "ACTIVE");
  const result = await client.query<{publicId: string}>(`
    INSERT INTO auth."tRefreshToken" (
      "sessionId", "refreshTokenStatusId", "familyPublicId", "rotationNumber", "tokenHash", "expireDtm"
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING "publicId"::TEXT AS "publicId"
  `, [input.sessionId, statusId, input.familyPublicId, input.rotationNumber, hashSecret(input.token), input.expireAt]);
  return result.rows[0]?.publicId;
}

export async function rotateRefreshToken(refreshToken: string) {
  return withTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      sessionId: string;
      familyPublicId: string;
      rotationNumber: number;
      expireDtm: Date;
      isUsable: boolean;
      useDtm: Date | null;
      revokeDtm: Date | null;
    }>(`
      SELECT
        token."id",
        token."sessionId",
        token."familyPublicId"::TEXT AS "familyPublicId",
        token."rotationNumber",
        token."expireDtm",
        status."isUsable",
        token."useDtm",
        token."revokeDtm"
      FROM auth."tRefreshToken" token
      JOIN auth."tRefreshTokenStatus" status ON status."id" = token."refreshTokenStatusId"
      WHERE token."tokenHash" = $1
      FOR UPDATE
    `, [hashSecret(refreshToken)]);
    const current = result.rows[0];
    if (!current) throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token недействителен");

    if (!current.isUsable || current.useDtm || current.revokeDtm || current.expireDtm <= new Date()) {
      await revokeRefreshFamily(client, current.familyPublicId, "REUSE_DETECTED");
      await revokeSession(client, current.sessionId, "REFRESH_REUSE_DETECTED");
      throw new ApiError(401, "REFRESH_REUSE_DETECTED", "Refresh token был повторно использован");
    }

    const newRefreshToken = createOpaqueToken(48);
    const nextPublicId = await createRefreshToken(client, {
      sessionId: current.sessionId,
      familyPublicId: current.familyPublicId,
      rotationNumber: current.rotationNumber + 1,
      token: newRefreshToken,
      expireAt: current.expireDtm,
    });
    await client.query(`
      UPDATE auth."tRefreshToken"
      SET "refreshTokenStatusId" = (SELECT "id" FROM auth."tRefreshTokenStatus" WHERE "code" = 'USED'),
          "useDtm" = CURRENT_TIMESTAMP,
          "replaceByPublicId" = $2
      WHERE "id" = $1
    `, [current.id, nextPublicId]);

    const session = await client.query<{accountId: string; sessionPublicId: string}>(`
      UPDATE auth."tSession"
      SET "lastSeenDtm" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "revokeDtm" IS NULL
        AND "absoluteExpireDtm" > CURRENT_TIMESTAMP
      RETURNING "accountId", "publicId"::TEXT AS "sessionPublicId"
    `, [current.sessionId]);
    const sessionRow = session.rows[0];
    if (!sessionRow) throw new ApiError(401, "SESSION_NOT_ACTIVE", "Сессия недоступна");

    const account = await loadPublicAccount(client, sessionRow.accountId, sessionRow.sessionPublicId);
    return {
      account,
      tokens: {
        accessToken: createAccessToken({
          accountPublicId: account.id,
          sessionPublicId: sessionRow.sessionPublicId,
          roles: account.roles,
          permissions: account.permissions,
        }),
        refreshToken: newRefreshToken,
        tokenType: "Bearer" as const,
        expiresIn: config.JWT_ACCESS_TTL_SECONDS,
      },
    };
  });
}

async function revokeRefreshFamily(client: DatabaseClient, familyPublicId: string, statusCode = "REVOKED") {
  await client.query(`
    UPDATE auth."tRefreshToken"
    SET "refreshTokenStatusId" = (SELECT "id" FROM auth."tRefreshTokenStatus" WHERE "code" = $2),
        "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP)
    WHERE "familyPublicId" = $1
      AND "revokeDtm" IS NULL
  `, [familyPublicId, statusCode]);
}

export async function revokeSession(client: DatabaseClient, sessionId: string, reasonCode = "LOGOUT", actorAccountId?: string | null) {
  await client.query(`
    UPDATE auth."tSession"
    SET "sessionStatusId" = (SELECT "id" FROM auth."tSessionStatus" WHERE "code" = 'REVOKED'),
        "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP),
        "revokeReasonCode" = COALESCE("revokeReasonCode", $2),
        "revokeByAccountId" = COALESCE("revokeByAccountId", $3)
    WHERE "id" = $1
      AND "revokeDtm" IS NULL
  `, [sessionId, reasonCode, actorAccountId ?? null]);
}

export async function logoutSession(sessionPublicId: string) {
  await query(`
    UPDATE auth."tSession"
    SET "sessionStatusId" = (SELECT "id" FROM auth."tSessionStatus" WHERE "code" = 'REVOKED'),
        "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP),
        "revokeReasonCode" = COALESCE("revokeReasonCode", 'LOGOUT')
    WHERE "publicId" = $1
      AND "revokeDtm" IS NULL
  `, [sessionPublicId]);
}

export async function loadPublicAccount(client: DatabaseClient, accountId: string, sessionPublicId?: string): Promise<PublicAccount> {
  const result = await client.query<{
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    status: string;
    roles: string[];
    permissions: string[];
  }>(`
    SELECT
      account."publicId"::TEXT AS "id",
      profile."username"::TEXT AS "username",
      profile."displayName" AS "displayName",
      emailIdentity."displayValue" AS "email",
      accountStatus."code" AS "status",
      COALESCE(array_agg(DISTINCT role."code") FILTER (WHERE role."code" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "roles",
      COALESCE(array_agg(DISTINCT permission."code") FILTER (WHERE permission."code" IS NOT NULL), ARRAY[]::VARCHAR[]) AS "permissions"
    FROM account."tAccount" account
    JOIN account."tAccountStatus" accountStatus ON accountStatus."id" = account."accountStatusId"
    JOIN account."tProfile" profile ON profile."accountId" = account."id"
    LEFT JOIN auth."tIdentity" emailIdentity
      ON emailIdentity."accountId" = account."id"
     AND emailIdentity."isPrimary" = TRUE
     AND emailIdentity."revokeDtm" IS NULL
     AND emailIdentity."identityTypeId" = (SELECT "id" FROM auth."tIdentityType" WHERE "code" = 'EMAIL')
    LEFT JOIN access."tRoleAssignment" assignment
      ON assignment."accountId" = account."id"
     AND assignment."revokeDtm" IS NULL
     AND assignment."validFromDtm" <= CURRENT_TIMESTAMP
     AND (assignment."validUntilDtm" IS NULL OR assignment."validUntilDtm" > CURRENT_TIMESTAMP)
     AND assignment."roleAssignmentStatusId" = (SELECT "id" FROM access."tRoleAssignmentStatus" WHERE "code" = 'ACTIVE')
    LEFT JOIN access."tRole" role ON role."id" = assignment."roleId" AND role."isActive" = TRUE
    LEFT JOIN access."tRolePermission" rolePermission ON rolePermission."roleId" = role."id"
    LEFT JOIN access."tPermission" permission ON permission."id" = rolePermission."permissionId" AND permission."isActive" = TRUE
    WHERE account."id" = $1
    GROUP BY account."publicId", profile."username", profile."displayName", emailIdentity."displayValue", accountStatus."code"
  `, [accountId]);
  const account = result.rows[0];
  if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Аккаунт не найден");
  if (sessionPublicId) {
    await client.query(`UPDATE auth."tSession" SET "lastSeenDtm" = CURRENT_TIMESTAMP WHERE "publicId" = $1`, [sessionPublicId]);
  }
  return account;
}

export async function validateAccessTokenSession(payload: AccessTokenPayload): Promise<AuthContext | null> {
  const result = await query<{
    accountId: string;
    sessionId: string;
    accountPublicId: string;
    sessionPublicId: string;
    displayName: string;
    username: string;
    email: string | null;
    accountStatus: string;
  }>(`
    SELECT
      account."id" AS "accountId",
      session."id" AS "sessionId",
      account."publicId"::TEXT AS "accountPublicId",
      session."publicId"::TEXT AS "sessionPublicId",
      profile."displayName" AS "displayName",
      profile."username"::TEXT AS "username",
      emailIdentity."displayValue" AS "email",
      accountStatus."code" AS "accountStatus"
    FROM auth."tSession" session
    JOIN auth."tSessionStatus" sessionStatus ON sessionStatus."id" = session."sessionStatusId"
    JOIN account."tAccount" account ON account."id" = session."accountId"
    JOIN account."tAccountStatus" accountStatus ON accountStatus."id" = account."accountStatusId"
    JOIN account."tProfile" profile ON profile."accountId" = account."id"
    LEFT JOIN auth."tIdentity" emailIdentity
      ON emailIdentity."accountId" = account."id"
     AND emailIdentity."isPrimary" = TRUE
     AND emailIdentity."revokeDtm" IS NULL
     AND emailIdentity."identityTypeId" = (SELECT "id" FROM auth."tIdentityType" WHERE "code" = 'EMAIL')
    WHERE account."publicId" = $1
      AND session."publicId" = $2
      AND session."revokeDtm" IS NULL
      AND session."absoluteExpireDtm" > CURRENT_TIMESTAMP
      AND sessionStatus."isUsable" = TRUE
      AND accountStatus."isLoginAllowed" = TRUE
  `, [payload.sub, payload.sid]);
  const row = result.rows[0];
  if (!row) return null;
  const account = await loadPublicAccount({query}, row.accountId, row.sessionPublicId);
  return {
    accountId: row.accountId,
    sessionId: row.sessionId,
    accountPublicId: row.accountPublicId,
    sessionPublicId: row.sessionPublicId,
    displayName: row.displayName,
    username: row.username,
    email: row.email,
    accountStatus: row.accountStatus,
    roles: account.roles,
    permissions: account.permissions,
  };
}

export async function signInWithSeed(seedPhrase: string) {
  return withTransaction(async (client) => {
    const result = await client.query<{accountId: string}>(`
      SELECT credential."accountId"
      FROM auth."tCredential" credential
      JOIN auth."tCredentialType" credentialType ON credentialType."id" = credential."credentialTypeId"
      JOIN account."tAccount" account ON account."id" = credential."accountId"
      JOIN account."tAccountStatus" accountStatus ON accountStatus."id" = account."accountStatusId"
      WHERE credentialType."code" = 'RECOVERY_SEED'
        AND credential."secretHash" = $1
        AND credential."revokeDtm" IS NULL
        AND (credential."expireDtm" IS NULL OR credential."expireDtm" > CURRENT_TIMESTAMP)
        AND accountStatus."isLoginAllowed" = TRUE
      LIMIT 1
    `, [hashSecret(seedPhrase)]);
    const row = result.rows[0];
    if (!row) throw new ApiError(401, "INVALID_SEED_PHRASE", "Seed phrase недействительна");
    await client.query(`UPDATE auth."tCredential" SET "lastUseDtm" = CURRENT_TIMESTAMP WHERE "accountId" = $1`, [row.accountId]);
    return issueSessionTokens(client, row.accountId);
  });
}

export async function replaceRecoverySeed(accountId: string, seedPhrase: string) {
  return withTransaction(async (client) => {
    const credentialTypeId = await lookupId(client, 'auth."tCredentialType"', "RECOVERY_SEED");
    await client.query(`
      UPDATE auth."tCredential"
      SET "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP)
      WHERE "accountId" = $1
        AND "credentialTypeId" = $2
        AND "revokeDtm" IS NULL
    `, [accountId, credentialTypeId]);
    await client.query(`
      INSERT INTO auth."tCredential" (
        "accountId", "credentialTypeId", "credentialIdentifier", "secretHash", "algorithm", "algorithmParameters"
      )
      VALUES ($1, $2, 'bip39', $3, 'SHA256', '{"wordlist":"english"}'::JSONB)
    `, [accountId, credentialTypeId, hashSecret(seedPhrase)]);
  });
}

export async function writeLoginAttempt(input: {accountId?: string | null; identity?: string | null; successful: boolean; failureCode?: string | null}) {
  await query(`
    INSERT INTO auth."tLoginAttempt" ("accountId", "identityDigest", "isSuccessful", "failureCode")
    VALUES ($1, $2, $3, $4)
  `, [input.accountId ?? null, input.identity ? sha256Buffer(input.identity) : null, input.successful, input.failureCode ?? null]);
}

export function publicAccountResponse(account: PublicAccount) {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    email: account.email,
    status: account.status,
    roles: account.roles,
    permissions: account.permissions,
  };
}
