import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import type {FastifyInstance} from "fastify";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.DATABASE_URL ||= "postgres://mecorion:mecorion@127.0.0.1:5432/mecorion";
process.env.JWT_SECRET ||= "test-only-secret";

let app: FastifyInstance;
let database: typeof import("../src/core/database.js").database;

before(async () => {
  const appModule = await import("../src/core/http/app.js");
  const databaseModule = await import("../src/core/database.js");
  database = databaseModule.database;
  app = await appModule.createApp();
  await app.ready();
});

after(async () => {
  await app.close();
  await database.end();
});

const protectedRoutes = [
  ["GET", "/api/v1/admin/access"],
  ["GET", "/api/v1/admin/legal/references"],
  ["GET", "/api/v1/admin/library/collections"],
  ["GET", "/api/v1/admin/audit/events"],
  ["GET", "/api/v1/admin/outbox/events"],
] as const;

for (const [method, url] of protectedRoutes) {
  test(`${method} ${url} requires authentication`, async () => {
    const response = await app.inject({method, url});
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), {
      error: "UNAUTHENTICATED",
      message: "Требуется вход в Mecorion",
    });
  });
}

test("unknown API route returns 404", async () => {
  const response = await app.inject({method: "GET", url: "/api/v1/unknown"});
  assert.equal(response.statusCode, 404);
});

test("CORS preflight accepts PUT used by favorites", async () => {
  const response = await app.inject({
    method: "OPTIONS",
    url: "/api/v1/library/favorites/00000000-0000-0000-0000-000000000000",
    headers: {
      origin: "http://127.0.0.1:5173",
      "access-control-request-method": "PUT",
    },
  });
  assert.equal(response.statusCode, 204);
  assert.match(String(response.headers["access-control-allow-methods"]), /PUT/);
});
