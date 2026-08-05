import type {FastifyRequest} from "fastify";
import {query} from "../../core/database/database.js";
import {hashSessionToken} from "./auth.crypto.js";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin" | "super_admin";
}

export interface UserWithPassword extends AuthUser {
  passwordHash: string;
  passwordSalt: string;
  disabledAt: string | null;
}

export interface SessionUser extends AuthUser {
  sessionId: string;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function findUserByEmail(email: string) {
  const result = await query<UserWithPassword>(`
    SELECT
      id,
      email,
      display_name AS "displayName",
      role,
      password_hash AS "passwordHash",
      password_salt AS "passwordSalt",
      disabled_at AS "disabledAt"
    FROM identity.users
    WHERE lower(email) = lower($1)
  `, [email]);

  return result.rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
}) {
  const result = await query<AuthUser>(`
    INSERT INTO identity.users (email, display_name, password_hash, password_salt)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, display_name AS "displayName", role
  `, [input.email, input.displayName, input.passwordHash, input.passwordSalt]);

  const user = result.rows[0];
  if (!user) {
    throw new Error("Не удалось создать пользователя");
  }

  return user;
}

export async function createSession(input: {
  userId: string;
  token: string;
  userAgent?: string;
  expiresAt: Date;
}) {
  const tokenHash = hashSessionToken(input.token);
  const result = await query<{id: string}>(`
    INSERT INTO identity.sessions (user_id, token_hash, user_agent, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [input.userId, tokenHash, input.userAgent ?? null, input.expiresAt]);

  return result.rows[0];
}

export async function revokeSession(sessionId: string) {
  await query(`
    UPDATE identity.sessions
    SET revoked_at = now()
    WHERE id = $1 AND revoked_at IS NULL
  `, [sessionId]);
}

export function readBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function getSessionUser(request: FastifyRequest) {
  const token = readBearerToken(request);
  if (!token) return null;

  const result = await query<SessionUser>(`
    UPDATE identity.sessions s
    SET last_seen_at = now()
    FROM identity.users u
    WHERE
      s.user_id = u.id
      AND s.token_hash = $1
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND u.disabled_at IS NULL
    RETURNING
      s.id AS "sessionId",
      u.id,
      u.email,
      u.display_name AS "displayName",
      u.role
  `, [hashSessionToken(token)]);

  return result.rows[0] ?? null;
}
