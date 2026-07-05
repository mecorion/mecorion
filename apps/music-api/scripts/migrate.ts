import "dotenv/config";
import {readdir, readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {Pool} from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL не задан");

const pool = new Pool({connectionString: databaseUrl});
const migrationsDirectory = fileURLToPath(new URL("../database/migrations", import.meta.url));
const client = await pool.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.music_api_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // Advisory lock не позволяет двум экземплярам API одновременно применить
  // одну миграцию во время развёртывания.
  await client.query("SELECT pg_advisory_lock(734221)");
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const applied = await client.query("SELECT 1 FROM public.music_api_migrations WHERE name = $1", [file]);
    if (applied.rowCount) continue;

    const sql = await readFile(new URL(`../database/migrations/${file}`, import.meta.url), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO public.music_api_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Применена миграция: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(734221)").catch(() => undefined);
  client.release();
  await pool.end();
}

