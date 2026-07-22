import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.databaseUrl });

/**
 * Creates the pgvector extension and the tables this app needs.
 * Safe to run every time the server boots (IF NOT EXISTS everywhere).
 */
export async function ensureSchema() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

  // Ingested documentation chunks (GitHub docs, Git docs, etc.)
  // Our free embedding model outputs 384-dimension vectors.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doc_chunks (
      id BIGSERIAL PRIMARY KEY,
      source_url TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      embedding VECTOR(384),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
    ON doc_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  `);

  // History of problems + what we recommended
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id BIGSERIAL PRIMARY KEY,
      repo TEXT,
      error_text TEXT,
      classification TEXT,
      recommendation TEXT,
      suggested_commands TEXT[],
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}
