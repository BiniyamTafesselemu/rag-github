import { env } from "../../config/env.js";
import { callLlm } from "./llmClient.js";

export interface DocChunk {
  sourceUrl: string;
  title: string | null;
  content: string;
}

const SYSTEM_PROMPT = `You are a GitHub/Git troubleshooting assistant.
Explain the problem clearly and give a recommendation grounded ONLY in the
provided documentation excerpts. If the excerpts don't cover something,
say so rather than guessing. Cite which excerpt (by number) backs each claim.`;

export async function generateRecommendation(input: {
  problemDescription: string;
  chunks: DocChunk[];
}): Promise<string> {
  const context = input.chunks
    .map((c, i) => `[${i + 1}] Source: ${c.sourceUrl}\n${c.content}`)
    .join("\n\n");

  return callLlm(env.groq.generatorModel, env.groq.apiKey, [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Problem:\n${input.problemDescription}\n\nRelevant documentation:\n${context || "(none retrieved)"}\n\nExplain the issue and recommend a fix, citing sources by number.`,
    },
  ]);
}
