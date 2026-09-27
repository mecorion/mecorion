import type {FastifyReply, FastifyRequest} from "fastify";
import {config} from "../../core/config.js";
import type {AuthTokens} from "./auth.repository.js";

export const ACCESS_COOKIE = "mecorion_access";
export const REFRESH_COOKIE = "mecorion_refresh";

function parseCookies(request: FastifyRequest) {
  return Object.fromEntries((request.headers.cookie ?? "").split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [];
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    return name ? [[name, decodeURIComponent(value)]] : [];
  }));
}

function serializeCookie(name: string, value: string, maxAge: number) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ];
  if (config.AUTH_COOKIE_DOMAIN) parts.push(`Domain=${config.AUTH_COOKIE_DOMAIN}`);
  if (config.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function readAccessCookie(request: FastifyRequest) {
  return parseCookies(request)[ACCESS_COOKIE] ?? null;
}

export function readRefreshCookie(request: FastifyRequest) {
  return parseCookies(request)[REFRESH_COOKIE] ?? null;
}

export function setAuthCookies(reply: FastifyReply, tokens: AuthTokens) {
  reply.header("Set-Cookie", [
    serializeCookie(ACCESS_COOKIE, tokens.accessToken, tokens.expiresIn),
    serializeCookie(REFRESH_COOKIE, tokens.refreshToken, config.JWT_REFRESH_TTL_DAYS * 86_400),
  ]);
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.header("Set-Cookie", [
    serializeCookie(ACCESS_COOKIE, "", 0),
    serializeCookie(REFRESH_COOKIE, "", 0),
  ]);
}

export function publicTokens(tokens: AuthTokens) {
  return {accessToken: tokens.accessToken, tokenType: tokens.tokenType, expiresIn: tokens.expiresIn};
}
