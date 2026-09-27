import "dotenv/config";
import {readdir, readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {Pool} from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL не задан");

const pool = new Pool({connectionString: databaseUrl});
const migrationsDirectory = fileURLToPath(new URL("../../../database/migrations", import.meta.url));
const client = await pool.connect();

// Если схема была создана вручную или восстановлена из дампа без журнала,
// повторный CREATE завершится неочевидной ошибкой. Sentinel-таблицы позволяют
// остановиться до выполнения файла и не маскировать рассинхронизацию.
const migrationSentinels: Readonly<Record<string, string>> = {
  "010_core.sql": 'core."tService"',
  "020_account.sql": 'account."tAccount"',
  "030_auth.sql": 'auth."tIdentity"',
  "040_access.sql": 'access."tRole"',
  "050_content.sql": 'content."tContent"',
  "060_media.sql": 'media."tAsset"',
  "070_workflow.sql": 'workflow."tRequest"',
  "080_moderation.sql": 'moderation."tReport"',
  "090_legal.sql": 'legal."tLegalStatus"',
  "100_library.sql": 'library."tCollection"',
  "110_music.sql": 'music."tTrack"',
  "120_video.sql": 'video."tVideo"',
  "130_audit.sql": 'audit."tAuditEvent"',
};

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.mecorion_api_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // Advisory lock не позволяет двум экземплярам API одновременно применить
  // одну миграцию во время развёртывания.
  await client.query("SELECT pg_advisory_lock(734221)");
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const applied = await client.query("SELECT 1 FROM public.mecorion_api_migrations WHERE name = $1", [file]);
    if (applied.rowCount) continue;

    const sentinel = migrationSentinels[file];
    if (sentinel) {
      const existingRelation = await client.query<{relation: string | null}>(
        "SELECT to_regclass($1)::text AS relation",
        [sentinel],
      );
      if (existingRelation.rows[0]?.relation) {
        throw new Error(
          `Миграция ${file} отсутствует в журнале, но таблица ${sentinel} уже существует. ` +
            "База создана вне текущего migration runner. Не помечайте миграции применёнными автоматически: " +
            "сначала сверьте схему или используйте чистую базу.",
        );
      }
    }

    const sql = await readFile(new URL(`../../../database/migrations/${file}`, import.meta.url), "utf8");
    await client.query(sql);
    await client.query("INSERT INTO public.mecorion_api_migrations (name) VALUES ($1)", [file]);
    console.log(`Применена миграция: ${file}`);
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(734221)").catch(() => undefined);
  client.release();
  await pool.end();
}
