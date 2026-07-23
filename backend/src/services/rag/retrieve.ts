import { pool } from "../../config/db.js";
import { embedText } from "./embeddings.js";

export interface DocChunk {
  sourceUrl: string;
  title: string | null;
  content: string;
}

export async function retrieveRelevantDocs(query: string, topK = 5): Promise<DocChunk[]> {
  const embedding = await embedText(query);
  const vectorLiteral = `[${embedding.join(",")}]`;

  const { rows } = await pool.query(
    `SELECT source_url, title, content
     FROM doc_chunks
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [vectorLiteral, topK]
  );

  return rows.map((r) => ({
    sourceUrl: r.source_url,
    title: r.title,
    content: r.content,
  }));
}
