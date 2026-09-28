import type {FastifyRequest} from "fastify";
import {config} from "../config.js";
import {query} from "../database.js";
import {ApiError} from "./api-error.js";
import {loadDevelopmentAuthContext, validateAccessTokenSession} from "../../modules/auth/auth.repository.js";
import {verifyAccessToken} from "../../modules/auth/auth.tokens.js";
import {readAccessCookie} from "../../modules/auth/auth.cookies.js";

export interface AuthContext {
  accountId: string;
  accountPublicId: string;
  sessionId: string | null;
  sessionPublicId: string | null;
  displayName: string;
  username: string;
  email: string | null;
  accountStatus: string;
  roles: string[];
  permissions: string[];
}

// A request can pass through the global admin gate and a domain-specific
// permission check. Reusing the resolved context avoids duplicate DB queries.
const requestAuthContext = new WeakMap<FastifyRequest, AuthContext>();

export function readBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function requireAuth(request: FastifyRequest): Promise<AuthContext> {
  const cached = requestAuthContext.get(request);
  if (cached) return cached;

  if (config.AUTH_MODE === "dev-bypass") {
    const context = await loadDevelopmentAuthContext(config.DEV_AUTH_ACCOUNT);
    if (!context) {
      throw new ApiError(
        503,
        "DEV_ACCOUNT_NOT_FOUND",
        `Dev-аккаунт ${config.DEV_AUTH_ACCOUNT} не найден или недоступен. Выполните npm run db:seed.`,
      );
    }
    requestAuthContext.set(request, context);
    return context;
  }

  const token = readBearerToken(request) ?? readAccessCookie(request);
  if (!token) {
    throw new ApiError(401, "UNAUTHENTICATED", "Требуется вход в Mecorion");
  }

  const payload = verifyAccessToken(token);
  const context = await validateAccessTokenSession(payload);

  if (!context) {
    throw new ApiError(401, "SESSION_NOT_ACTIVE", "Сессия недоступна или аккаунт заблокирован");
  }

  requestAuthContext.set(request, context);
  return context;
}

export async function requirePermission(request: FastifyRequest, permission: string): Promise<AuthContext> {
  const context = await requireAuth(request);
  const restriction = await query(`
    SELECT 1
    FROM moderation."tRestriction" restriction
    JOIN moderation."tRestrictionStatus" status
      ON status."id" = restriction."restrictionStatusId" AND status."isEffective" = TRUE
    JOIN access."tScope" scope ON scope."id" = restriction."scopeId"
    JOIN access."tPermission" requestedPermission ON requestedPermission."code" = $2
    WHERE restriction."accountId" = $1
      AND restriction."revokeDtm" IS NULL
      AND restriction."validFromDtm" <= CURRENT_TIMESTAMP
      AND (restriction."validUntilDtm" IS NULL OR restriction."validUntilDtm" > CURRENT_TIMESTAMP)
      AND (restriction."permissionId" IS NULL OR restriction."permissionId" = requestedPermission."id")
      AND (scope."code" = 'global' OR scope."serviceId" = requestedPermission."serviceId")
    LIMIT 1
  `, [context.accountId, permission]);
  if (restriction.rows[0]) {
    throw new ApiError(403, "PERMISSION_RESTRICTED", "Доступ временно ограничен решением модерации");
  }
  if (
    !context.permissions.includes(permission)
    && !context.permissions.includes("platform.admin")
    && !context.permissions.includes("platform.owner")
  ) {
    throw new ApiError(403, "FORBIDDEN", "Недостаточно прав");
  }

  return context;
}

export async function requireAdminPanelAccess(request: FastifyRequest): Promise<AuthContext> {
  const context = await requireAuth(request);
  const hasAdminRole = context.roles.includes("ADMIN");
  const hasAdminPermission = context.permissions.includes("platform.admin");

  if (!hasAdminRole || !hasAdminPermission) {
    throw new ApiError(
      403,
      "ADMIN_PANEL_FORBIDDEN",
      "Для доступа нужна роль ADMIN и разрешение platform.admin",
    );
  }

  return context;
}
