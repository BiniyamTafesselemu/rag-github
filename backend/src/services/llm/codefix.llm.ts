import { env } from "../../config/env.js";
import { callLlm } from "./llmClient.js";

export interface CodeFixPlan {
  summary: string;
  commands: string[];
  risk: "low" | "medium" | "high";
  requiresConfirmation: boolean;
}

const SYSTEM_PROMPT = `You turn a Git/GitHub recommendation into a concrete action plan.
Respond ONLY with JSON, no prose, no markdown fences, in this shape:
{"summary": "<one line>", "commands": ["<shell command>", ...], "risk": "low|medium|high", "requiresConfirmation": true|false}
Only include commands that are safe to show a user before they run them (no destructive
force-pushes or resets without requiresConfirmation=true and a risk note in summary).`;

export async function proposeFix(input: {
  recommendation: string;
  terminalOutput?: string;
}): Promise<CodeFixPlan> {
  const raw = await callLlm(env.groq.codefixModel, env.groq.apiKey, [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Recommendation:\n${input.recommendation}\n\nOriginal terminal output:\n${input.terminalOutput ?? "(none)"}`,
    },
  ]);

  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```json|```$/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  try {
    return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
  } catch {
    return { summary: cleaned.slice(0, 200), commands: [], risk: "medium", requiresConfirmation: true };
  }
}