import type {FastifyRequest} from "fastify";
import {ApiError} from "./api-error.js";
import {validateAccessTokenSession} from "../../modules/auth/auth.repository.js";
import {verifyAccessToken} from "../../modules/auth/auth.tokens.js";

export interface AuthContext {
  accountId: string;
  accountPublicId: string;
  sessionId: string;
  sessionPublicId: string;
  displayName: string;
  username: string;
  email: string | null;
  accountStatus: string;
  roles: string[];
  permissions: string[];
}

export function readBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function requireAuth(request: FastifyRequest): Promise<AuthContext> {
  const token = readBearerToken(request);
  if (!token) {
    throw new ApiError(401, "UNAUTHENTICATED", "Требуется вход в Mecorion");
  }

  const payload = verifyAccessToken(token);
  const context = await validateAccessTokenSession(payload);

  if (!context) {
    throw new ApiError(401, "SESSION_NOT_ACTIVE", "Сессия недоступна или аккаунт заблокирован");
  }

  return context;
}

export async function requirePermission(request: FastifyRequest, permission: string): Promise<AuthContext> {
  const context = await requireAuth(request);
  if (!context.permissions.includes(permission) && !context.permissions.includes("platform.owner")) {
    throw new ApiError(403, "FORBIDDEN", "Недостаточно прав");
  }

  return context;
}
