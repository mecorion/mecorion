import {Pool, type PoolClient, type QueryResult, type QueryResultRow} from "pg";
import {config} from "./config.js";

export const database = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function query<Row extends QueryResultRow>(text: string, values: unknown[] = []) {
  return database.query<Row>(text, values);
}

export interface DatabaseClient {
  query<Row extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

export async function withTransaction<Result>(callback: (client: PoolClient) => Promise<Result>) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
