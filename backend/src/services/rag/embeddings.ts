import { pipeline } from "@xenova/transformers";

// Loaded once and reused — downloads the model (~90MB) the first time this runs.
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

/**
 * Turns text into a 384-dimension vector using a free local model.
 * No API key, no cost — runs entirely on your machine.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
