import {createHmac, createSign, createVerify, randomUUID, timingSafeEqual} from "node:crypto";
import {config} from "../../core/config.js";
import {ApiError} from "../../core/http/api-error.js";

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  jti: string;
  aud: "mecorion-api";
  iss: "mecorion";
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseBase64UrlJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function signJwtInput(input: string) {
  if (config.JWT_MODE === "secret") {
    return createHmac("sha256", config.JWT_SECRET ?? "").update(input).digest("base64url");
  }

  return createSign("RSA-SHA256").update(input).end().sign(config.JWT_PRIVATE_KEY ?? "", "base64url");
}

function verifyJwtInput(input: string, signature: string) {
  if (config.JWT_MODE === "secret") {
    const expectedSignature = signJwtInput(input);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  return createVerify("RSA-SHA256").update(input).end().verify(config.JWT_PUBLIC_KEY ?? "", signature, "base64url");
}

export function createAccessToken(input: {
  accountPublicId: string;
  sessionPublicId: string;
  roles: string[];
  permissions: string[];
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: config.JWT_MODE === "secret" ? "HS256" : "RS256",
    typ: "JWT",
  };
  const payload: AccessTokenPayload = {
    sub: input.accountPublicId,
    sid: input.sessionPublicId,
    roles: input.roles,
    permissions: input.permissions,
    iat: now,
    exp: now + config.JWT_ACCESS_TTL_SECONDS,
    jti: randomUUID(),
    aud: "mecorion-api",
    iss: "mecorion",
  };

  const encodedHeader = base64UrlJson(header);
  const encodedPayload = base64UrlJson(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  return `${signingInput}.${signJwtInput(signingInput)}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new ApiError(401, "INVALID_TOKEN", "Некорректный access token");
  }

  const [encodedHeader, encodedPayload, signature] = parts as [string, string, string];
  const header = parseBase64UrlJson<{alg?: string; typ?: string}>(encodedHeader);
  const expectedAlgorithm = config.JWT_MODE === "secret" ? "HS256" : "RS256";
  if (header.alg !== expectedAlgorithm || header.typ !== "JWT") {
    throw new ApiError(401, "INVALID_TOKEN", "Некорректный алгоритм access token");
  }

  if (!verifyJwtInput(`${encodedHeader}.${encodedPayload}`, signature)) {
    throw new ApiError(401, "INVALID_TOKEN", "Некорректная подпись access token");
  }

  const payload = parseBase64UrlJson<AccessTokenPayload>(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== "mecorion" || payload.aud !== "mecorion-api" || payload.exp <= now) {
    throw new ApiError(401, "INVALID_TOKEN", "Access token истёк или недействителен");
  }

  return payload;
}
