import {Pool, type QueryResultRow} from "pg";
import {config} from "./config.js";

export const database = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Все маршруты используют эту функцию, чтобы тип результата SQL был указан
// рядом с запросом, а детали пула не распространялись по приложению.
export async function query<Row extends QueryResultRow>(text: string, values: unknown[] = []) {
  return database.query<Row>(text, values);
}

