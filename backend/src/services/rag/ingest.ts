import { pool } from "../../config/db.js";
import { embedText } from "./embeddings.js";

/** Simple fixed-size chunker with overlap. Good enough as a starting point. */
export function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function ingestDocument(sourceUrl: string, title: string, fullText: string) {
  const chunks = chunkText(fullText);

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    const vectorLiteral = `[${embedding.join(",")}]`;
    await pool.query(
      `INSERT INTO doc_chunks (source_url, title, content, embedding) VALUES ($1, $2, $3, $4)`,
      [sourceUrl, title, chunk, vectorLiteral]
    );
  }

  return { sourceUrl, chunksStored: chunks.length };
}
