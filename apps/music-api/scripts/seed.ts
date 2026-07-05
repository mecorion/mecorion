import "dotenv/config";
import {readFile} from "node:fs/promises";
import {Pool} from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL не задан");

const sql = await readFile(new URL("../database/seeds/development.sql", import.meta.url), "utf8");
const pool = new Pool({connectionString: databaseUrl});

try {
  await pool.query(sql);
  console.log("Тестовый музыкальный каталог добавлен");
} finally {
  await pool.end();
}

