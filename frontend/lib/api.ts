const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_APP_API_KEY ?? "";

function authHeaders(extra: Record<string, string> = {}) {
  return { ...extra, authorization: `Bearer ${API_KEY}` };
}

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
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
  return res.json();
}
export interface Mergeability {
  mergeable: boolean | null;
  mergeableState: string;
}

export async function checkMergeability(owner: string, repo: string, pullNumber: number): Promise<Mergeability> {
  const res = await fetch(`${API_BASE}/api/repo/${owner}/${repo}/pull/${pullNumber}/mergeability`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
  return res.json();
}

export interface TerminalResult {
  command: string;
  output: string;
  exitCode: number;
}

export async function runTerminalCommand(command: string, cwd: string): Promise<TerminalResult> {
  const res = await fetch(`${API_BASE}/api/terminal/run`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ command, cwd }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
  return res.json();
}
export interface SessionRecord {
  id: string;
  repo: string | null;
  error_text: string;
  classification: string;
  recommendation: string;
  suggested_commands: string[];
  created_at: string;
}

export async function getSessions(): Promise<SessionRecord[]> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
  return res.json();
}

export interface StreamCallbacks {
  onClassification?: (classification: string) => void;
  onSources?: (sources: { url: string; title: string | null }[]) => void;
  onToken?: (token: string) => void;
  onFixPlan?: (fixPlan: FixPlan) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

export async function analyzeStream(
  input: { terminalOutput?: string; diff?: string; repo?: string },
  callbacks: StreamCallbacks
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/analyze/stream`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    callbacks.onError?.("Failed to start stream");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event.split("\n");
      const eventType = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
      const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
      if (!eventType || !dataLine) continue;

      const data = JSON.parse(dataLine);

      if (eventType === "classification") callbacks.onClassification?.(data.classification);
      if (eventType === "sources") callbacks.onSources?.(data);
      if (eventType === "token") callbacks.onToken?.(data);
      if (eventType === "fixplan") callbacks.onFixPlan?.(data);
      if (eventType === "done") callbacks.onDone?.();
      if (eventType === "error") callbacks.onError?.(data.error);
    }
  }
}