import { env } from "../../config/env.js";
import { callLlm } from "./llmClient.js";

export interface RoutingResult {
  classification: string;
  searchQuery: string;
}

const SYSTEM_PROMPT = `You are a triage classifier for Git/GitHub problems.
Given terminal output or a diff, classify it and produce a short search query
to look up relevant GitHub/Git documentation.

Respond ONLY with JSON, no prose, no markdown fences, in this exact shape:
{"classification": "merge_conflict|push_rejected|auth_error|detached_head|rebase_conflict|no_error_improvement_opportunity|unknown", "searchQuery": "<short query>"}`;

export async function classifyProblem(input: { terminalOutput?: string; diff?: string }): Promise<RoutingResult> {
  const userContent = [input.terminalOutput, input.diff].filter(Boolean).join("\n\n");

  const raw = await callLlm(env.groq.routerModel, env.groq.apiKey, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ]);

  try {
    return JSON.parse(raw.trim().replace(/^```json|```$/g, "").trim());
  } catch {
    return { classification: "unknown", searchQuery: userContent.slice(0, 200) };
  }
}
