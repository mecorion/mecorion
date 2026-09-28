import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {config} from "../../core/config.js";
import {ApiError} from "../../core/http/api-error.js";
import {requireAuth} from "../../core/http/auth-context.js";
import {sendLoginCode} from "../mail/mail.service.js";
import {clearAuthCookies, publicTokens, readRefreshCookie, setAuthCookies} from "./auth.cookies.js";
import {
  assertValidRecoverySeed,
  createEmailCode,
  createRecoverySeed,
} from "./auth.crypto.js";
import {
  confirmEmailChallenge,
  confirmSeedWordChallenge,
  createAccount,
  createEmailChallenge,
  createSeedRegistrationChallenge,
  createSeedWordChallenge,
  findAccountByEmail,
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
  refreshToken: z.string().min(32).optional(),
});

const SeedRegisterSchema = z.object({
  displayName: z.string().trim().max(128).regex(/^[A-Za-zА-Яа-яЁё]*$/).optional(),
  username: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_]+$/),
  wordCount: z.union([z.literal(12), z.literal(24)]).default(12),
});

const SeedSignInSchema = z.object({
  seedPhrase: z.string().min(1),
});

const SeedChallengeStartSchema = z.object({
  login: z.string().trim().min(3).max(254),
});

const SeedChallengeConfirmSchema = z.object({
  login: z.string().trim().min(3).max(254),
  challengeId: z.uuid(),
  challengeToken: z.string().min(32).max(256),
  words: z.array(z.string().trim().min(1).max(32).regex(/^[a-zA-Z]+$/)).length(4),
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

  app.post("/api/v1/auth/email/sign-in/start", async (request) => {
    const input = EmailStartSchema.pick({email: true}).parse(request.body);
    const email = normalizeEmail(input.email);
    const account = await findAccountByEmail(email);

    if (!account || !account.isVerified || !account.isLoginAllowed) {
      // This endpoint is intentionally sign-in only: unlike email/start it
      // never creates an account from an unknown address.
      throw new ApiError(403, "ACCOUNT_NOT_AVAILABLE", "Аккаунт не найден или вход для него недоступен");
    }

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

  app.post("/api/v1/auth/email/confirm", async (request, reply) => {
    const input = EmailConfirmSchema.parse(request.body);
    const email = normalizeEmail(input.email);
    const seedPhrase = input.createSeedPhrase ? createRecoverySeed(input.seedWordCount) : null;
    const result = await confirmEmailChallenge({email, code: input.code.trim()});
    if (seedPhrase) {
      await replaceRecoverySeed(result.accountInternalId, seedPhrase);
    }
    await writeLoginAttempt({identity: email, successful: true});
    setAuthCookies(reply, result.tokens);
    return {
      user: publicAccountResponse(result.account),
      tokens: publicTokens(result.tokens),
      ...(seedPhrase ? {seedPhrase} : {}),
    };
  });

  app.post("/api/v1/auth/refresh", async (request, reply) => {
    const input = RefreshSchema.parse(request.body ?? {});
    const refreshToken = input.refreshToken ?? readRefreshCookie(request);
    if (!refreshToken) throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token отсутствует");
    const result = await rotateRefreshToken(refreshToken);
    setAuthCookies(reply, result.tokens);
    return {
      user: publicAccountResponse(result.account),
      tokens: publicTokens(result.tokens),
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

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const context = await requireAuth(request);
    if (context.sessionPublicId) await logoutSession(context.sessionPublicId);
    clearAuthCookies(reply);
    return {ok: true};
  });

  app.post("/api/v1/auth/seed/register", async (request) => {
    const input = SeedRegisterSchema.parse(request.body);
    const seedPhrase = createRecoverySeed(input.wordCount);
    const account = await createAccount({
      displayName: input.displayName?.trim() || 'New user',
      usernameBase: normalizeUsername(input.username),
      seedPhrase,
      emailVerified: false,
      statusCode: "PENDING",
    });
    const challenge = await createSeedRegistrationChallenge(account.accountId);
    return {
      seedPhrase,
      accountId: account.accountPublicId,
      username: account.username,
      ...challenge,
    };
  });

  app.post("/api/v1/auth/seed/register/confirm", async (request, reply) => {
    const input = SeedChallengeConfirmSchema.parse(request.body);
    const login = input.login.trim().toLowerCase();
    const result = await confirmSeedWordChallenge({...input, login, activatePending: true});
    await writeLoginAttempt({identity: login, successful: true});
    setAuthCookies(reply, result.tokens);
    return {user: publicAccountResponse(result.account), tokens: publicTokens(result.tokens)};
  });

  app.post("/api/v1/auth/seed/sign-in", async (request, reply) => {
    const input = SeedSignInSchema.parse(request.body);
    const seedPhrase = assertValidRecoverySeed(input.seedPhrase);
    const result = await signInWithSeed(seedPhrase);
    setAuthCookies(reply, result.tokens);
    return {
      user: publicAccountResponse(result.account),
      tokens: publicTokens(result.tokens),
    };
  });

  app.post("/api/v1/auth/seed/challenge/start", async (request) => {
    const input = SeedChallengeStartSchema.parse(request.body);
    return createSeedWordChallenge(input.login.trim().toLowerCase());
  });

  app.post("/api/v1/auth/seed/challenge/confirm", async (request, reply) => {
    const input = SeedChallengeConfirmSchema.parse(request.body);
    const login = input.login.trim().toLowerCase();
    try {
      const result = await confirmSeedWordChallenge({...input, login});
      await writeLoginAttempt({identity: login, successful: true});
      setAuthCookies(reply, result.tokens);
      return {
        user: publicAccountResponse(result.account),
        tokens: publicTokens(result.tokens),
      };
    } catch (error) {
      await writeLoginAttempt({identity: login, successful: false, failureCode: "INVALID_SEED_WORDS"});
      throw error;
    }
  });

  app.post("/api/v1/account/seed/regenerate", async (request) => {
    const context = await requireAuth(request);
    const input = SeedRegenerateSchema.parse(request.body);
    const seedPhrase = createRecoverySeed(input.wordCount);
    await replaceRecoverySeed(context.accountId, seedPhrase);
    return {seedPhrase};
  });
}
