"use client";

import { useState } from "react";
import { runTerminalCommand, type TerminalResult } from "@/lib/api";

export function LiveTerminal({ onAnalyze }: { onAnalyze: (output: string) => void }) {
  const [command, setCommand] = useState("git status");
  const [cwd, setCwd] = useState(process.env.NEXT_PUBLIC_DEFAULT_REPO_PATH ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TerminalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!command.trim() || !cwd.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runTerminalCommand(command, cwd);
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
      <h2 className="text-sm font-medium text-white/80">Run a real git command</h2>
      <p className="text-xs text-white/40">
        Only whitelisted commands (git, ls, cat, pwd, diff, status) run in this dev sandbox.
      </p>

      <input
        value={cwd}
        onChange={(e) => setCwd(e.target.value)}
        placeholder="/absolute/path/to/your/repo"
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm font-mono outline-none placeholder:text-white/30"
      />

      <div className="flex gap-2">
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="git status"
          className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm font-mono outline-none placeholder:text-white/30"
        />
        <button
          onClick={handleRun}
          disabled={loading || !command.trim() || !cwd.trim()}
          className="rounded bg-white/10 hover:bg-white/20 px-4 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-2">
          <pre className="rounded bg-black/60 p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
            {result.output || "(no output)"}
          </pre>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Exit code: {result.exitCode}</span>
            <button
              onClick={() => onAnalyze(result.output)}
              className="text-xs text-sky-400 hover:underline"
            >
              Send to analyzer →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
