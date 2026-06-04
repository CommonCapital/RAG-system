import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function initSchema(): Promise<void> {
  const db = getPool();

  // pgvector — loaded only when an embed provider is configured
  // await db.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source     TEXT NOT NULL,
      category   TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  // Vector column + index — re-enable when embed provider is available
  // await db.query(`ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(768)`);
  // await db.query(`CREATE INDEX IF NOT EXISTS ... USING ivfflat ...`);
}
