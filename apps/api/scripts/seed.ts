import "dotenv/config";
import {readdir, readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {Pool} from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL не задан");

const seedsDirectory = fileURLToPath(new URL("../../../database/seeds", import.meta.url));
const pool = new Pool({connectionString: databaseUrl});

try {
  const files = (await readdir(seedsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(new URL(`../../../database/seeds/${file}`, import.meta.url), "utf8");
    await pool.query(sql);
    console.log(`Применён seed: ${file}`);
  }
} finally {
  await pool.end();
}
