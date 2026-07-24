const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export interface FixPlan {
  summary: string;
  commands: string[];
  risk: "low" | "medium" | "high";
  requiresConfirmation: boolean;
}

export interface AnalyzeResponse {
  classification: string;
  sources: { url: string; title: string | null }[];
  recommendation: string;
  fixPlan: FixPlan;
}

export async function analyze(input: {
  terminalOutput?: string;
  diff?: string;
  repo?: string;
}): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
  return res.json();
}
