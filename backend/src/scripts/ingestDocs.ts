import { ensureSchema, pool } from "../config/db.js";
import { ingestDocument } from "../services/rag/ingest.js";

/**
 * Starter list of official GitHub/Git documentation pages worth indexing.
 * Add more URLs here any time — each one gets chunked, embedded, and stored.
 */
const SOURCES: { url: string; title: string }[] = [
  { url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line", title: "Resolving a merge conflict using the command line" },
  { url: "https://docs.github.com/en/authentication/troubleshooting-ssh/error-permission-denied-publickey", title: "Error: Permission denied (publickey)" },
  { url: "https://docs.github.com/en/repositories/creating-and-managing-repositories/troubleshooting-cloning-errors", title: "Troubleshooting cloning errors" },
  { url: "https://git-scm.com/docs/git-rebase", title: "git-rebase documentation" },
  { url: "https://git-scm.com/docs/git-push", title: "git-push documentation" },
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  await ensureSchema();

  for (const source of SOURCES) {
    console.log(`Fetching ${source.url}`);
    const res = await fetch(source.url);
    const html = await res.text();
    const text = stripHtml(html);
    const result = await ingestDocument(source.url, source.title, text);
    console.log(`Stored ${result.chunksStored} chunks for ${source.url}`);
  }

  await pool.end();
  console.log("Ingestion complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
