import "dotenv/config";
import {readdir, readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {Pool} from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL не задан");

const testsDirectory = fileURLToPath(new URL("../../../database/tests", import.meta.url));
const pool = new Pool({connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 5_000});

const requiredRelations = [
  'core."tService"',
  'account."tAccount"',
  'auth."tSession"',
  'access."tRole"',
  'content."tContent"',
  'media."tAsset"',
  'workflow."tRequest"',
  'moderation."tReport"',
  'legal."tLicense"',
  'library."tCollection"',
  'music."tTrack"',
  'video."tVideo"',
  'audit."tAuditEvent"',
] as const;

try {
  // Проверяем сам контракт схемы, а не только служебный журнал миграций.
  // Это позволяет безопасно тестировать базу, импортированную из SQL-дампа.
  const relationCheck = await pool.query<{name: string; relation: string | null}>(
    `SELECT "name", to_regclass("name")::text AS "relation"
       FROM unnest($1::text[]) AS required("name")`,
    [requiredRelations],
  );
  const missingRelations = relationCheck.rows.filter(({relation}) => !relation).map(({name}) => name);
  if (missingRelations.length) {
    throw new Error(
      `В базе отсутствуют обязательные таблицы: ${missingRelations.join(", ")}. ` +
        "Примените миграции и тестовые данные перед запуском smoke-тестов.",
    );
  }

  // test_all.sql содержит psql-директивы \ir. Node runner запускает входящие
  // smoke-файлы напрямую, поэтому он одинаково работает без установленного psql.
  const files = (await readdir(testsDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  for (const file of files) {
    const sql = await readFile(new URL(`../../../database/tests/${file}`, import.meta.url), "utf8");
    await pool.query(sql.replace(/^\\set ON_ERROR_STOP on\s*/m, ""));
    console.log(`Пройден SQL smoke-test: ${file}`);
  }
} finally {
  await pool.end();
}
