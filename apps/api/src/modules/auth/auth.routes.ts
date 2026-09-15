import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {config} from "../../core/config.js";
import {requireAuth} from "../../core/http/auth-context.js";
import {sendLoginCode} from "../mail/mail.service.js";
import {
  assertValidRecoverySeed,
  createEmailCode,
  createRecoverySeed,
} from "./auth.crypto.js";
import {
  confirmEmailChallenge,
  createAccount,
  createEmailChallenge,
  getOrCreateEmailAccount,
  logoutSession,
  normalizeEmail,
  normalizeUsername,
  publicAccountResponse,
  replaceRecoverySeed,
  rotateRefreshToken,
  signInWithSeed,
  writeLoginAttempt,
} from "./auth.repository.js";

const EmailStartSchema = z.object({
  email: z.email().max(254),
  displayName: z.string().trim().min(1).max(128).optional(),
});

const EmailConfirmSchema = z.object({
  email: z.email().max(254),
  code: z.string().trim().regex(/^\d{6}$/),
  createSeedPhrase: z.boolean().default(false),
  seedWordCount: z.union([z.literal(12), z.literal(24)]).default(12),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(32),
});

const SeedRegisterSchema = z.object({
  displayName: z.string().trim().min(1).max(128),
  username: z.string().trim().min(3).max(32).optional(),
  wordCount: z.union([z.literal(12), z.literal(24)]).default(12),
});

const SeedSignInSchema = z.object({
  seedPhrase: z.string().min(1),
});

const SeedRegenerateSchema = z.object({
  wordCount: z.union([z.literal(12), z.literal(24)]).default(12),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/email/start", async (request) => {
    const input = EmailStartSchema.parse(request.body);
    const email = normalizeEmail(input.email);
    const account = await getOrCreateEmailAccount({
      email,
      ...(input.displayName ? {displayName: input.displayName.trim()} : {}),
    });
    const code = createEmailCode();
    const challengeId = await createEmailChallenge({
      accountId: account.accountId,
      identityId: account.identityId,
      code,
    });
    await sendLoginCode(email, code);

    return {
      ok: true,
      challengeId,
      expiresIn: config.AUTH_CODE_TTL_SECONDS,
      ...(config.MAIL_DEV_MODE ? {devCode: code} : {}),
    };
  });

  app.post("/api/v1/auth/email/confirm", async (request) => {
    const input = EmailConfirmSchema.parse(request.body);
    const email = normalizeEmail(input.email);
    const seedPhrase = input.createSeedPhrase ? createRecoverySeed(input.seedWordCount) : null;
    const result = await confirmEmailChallenge({email, code: input.code.trim()});
    if (seedPhrase) {
      await replaceRecoverySeed(result.accountInternalId, seedPhrase);
    }
    await writeLoginAttempt({identity: email, successful: true});
    return {
      user: publicAccountResponse(result.account),
      tokens: result.tokens,
      ...(seedPhrase ? {seedPhrase} : {}),
    };
  });

  app.post("/api/v1/auth/refresh", async (request) => {
    const input = RefreshSchema.parse(request.body);
    const result = await rotateRefreshToken(input.refreshToken);
    return {
      user: publicAccountResponse(result.account),
      tokens: result.tokens,
    };
  });

  app.get("/api/v1/auth/me", async (request) => {
    const context = await requireAuth(request);
    return {
      user: {
        id: context.accountPublicId,
        username: context.username,
        displayName: context.displayName,
        email: context.email,
        status: context.accountStatus,
        roles: context.roles,
        permissions: context.permissions,
      },
    };
  });

  app.post("/api/v1/auth/logout", async (request) => {
    const context = await requireAuth(request);
    await logoutSession(context.sessionPublicId);
    return {ok: true};
  });

  app.post("/api/v1/auth/seed/register", async (request) => {
    const input = SeedRegisterSchema.parse(request.body);
    const seedPhrase = createRecoverySeed(input.wordCount);
    const account = await createAccount({
      displayName: input.displayName.trim(),
      usernameBase: normalizeUsername(input.username ?? input.displayName),
      seedPhrase,
      emailVerified: true,
      statusCode: "ACTIVE",
    });
    const result = await signInWithSeed(seedPhrase);
    return {
      user: publicAccountResponse(result.account),
      tokens: result.tokens,
      seedPhrase,
      accountId: account.accountPublicId,
    };
  });

  app.post("/api/v1/auth/seed/sign-in", async (request) => {
    const input = SeedSignInSchema.parse(request.body);
    const seedPhrase = assertValidRecoverySeed(input.seedPhrase);
    const result = await signInWithSeed(seedPhrase);
    return {
      user: publicAccountResponse(result.account),
      tokens: result.tokens,
    };
  });

  app.post("/api/v1/account/seed/regenerate", async (request) => {
    const context = await requireAuth(request);
    const input = SeedRegenerateSchema.parse(request.body);
    const seedPhrase = createRecoverySeed(input.wordCount);
    await replaceRecoverySeed(context.accountId, seedPhrase);
    return {seedPhrase};
  });
}
