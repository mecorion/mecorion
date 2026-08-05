import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {createSessionToken, hashPassword, verifyPassword} from "./auth.crypto.js";
import {
  createSession,
  createUser,
  findUserByEmail,
  getSessionUser,
  normalizeEmail,
  publicUser,
  revokeSession,
} from "./auth.repository.js";

const SessionTtlMs = 1000 * 60 * 60 * 24 * 30;

const SignUpSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  password: z.string().min(8).max(200),
});

const SignInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/sign-up", async (request, reply) => {
    const input = SignUpSchema.parse(request.body);
    const email = normalizeEmail(input.email);
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return reply.status(409).send({
        error: "EMAIL_ALREADY_USED",
        message: "Пользователь с таким email уже существует",
      });
    }

    const password = await hashPassword(input.password);
    const user = await createUser({
      email,
      displayName: input.displayName.trim(),
      passwordHash: password.hash,
      passwordSalt: password.salt,
    });

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SessionTtlMs);
    await createSession({
      userId: user.id,
      token,
      expiresAt,
      ...(request.headers["user-agent"] ? {userAgent: request.headers["user-agent"]} : {}),
    });

    return reply.status(201).send({token, user: publicUser(user)});
  });

  app.post("/api/v1/auth/sign-in", async (request, reply) => {
    const input = SignInSchema.parse(request.body);
    const user = await findUserByEmail(normalizeEmail(input.email));

    if (!user || user.disabledAt) {
      return reply.status(401).send({
        error: "INVALID_CREDENTIALS",
        message: "Неверный email или пароль",
      });
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordSalt, user.passwordHash);
    if (!passwordMatches) {
      return reply.status(401).send({
        error: "INVALID_CREDENTIALS",
        message: "Неверный email или пароль",
      });
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SessionTtlMs);
    await createSession({
      userId: user.id,
      token,
      expiresAt,
      ...(request.headers["user-agent"] ? {userAgent: request.headers["user-agent"]} : {}),
    });

    return {token, user: publicUser(user)};
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    const user = await getSessionUser(request);

    if (!user) {
      return reply.status(401).send({
        error: "UNAUTHENTICATED",
        message: "Требуется вход в Mecorion",
      });
    }

    return {user: publicUser(user)};
  });

  app.post("/api/v1/auth/logout", async (request) => {
    const user = await getSessionUser(request);

    // Logout должен быть идемпотентным: если токен уже истёк, клиенту всё равно
    // нужно очистить локальное состояние и уйти на публичный экран.
    if (user) {
      await revokeSession(user.sessionId);
    }

    return {ok: true};
  });
}
