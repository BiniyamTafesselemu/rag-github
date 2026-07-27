"use client";

import { useState } from "react";
import type { AnalyzeResponse } from "@/lib/api";
import { runTerminalCommand } from "@/lib/api";

const RISK_COLOR: Record<string, string> = {
  low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  high: "text-red-400 border-red-400/30 bg-red-400/10",
};

const DEFAULT_REPO_PATH = process.env.NEXT_PUBLIC_DEFAULT_REPO_PATH ?? "";

export function RecommendationCard({ result }: { result: AnalyzeResponse }) {
  const [tab, setTab] = useState<"analysis" | "solution">("analysis");
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const commandsText = result.fixPlan.commands.join("\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(commandsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleRunInSandbox() {
    setRunning(true);
    setRunError(null);
    setRunOutput(null);
    try {
      let combinedOutput = "";
      for (const command of result.fixPlan.commands) {
        const res = await runTerminalCommand(command, DEFAULT_REPO_PATH);
        combinedOutput += `$ ${command}\n${res.output}\n`;
      }
      setRunOutput(combinedOutput);
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function handleOpenInVSCode() {
    window.location.href = `vscode://file${DEFAULT_REPO_PATH}`;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/50">
          {result.classification.replaceAll("_", " ")}
        </span>
        <span className={`text-xs px-2 py-1 rounded border ${RISK_COLOR[result.fixPlan.risk] ?? ""}`}>
          {result.fixPlan.risk} risk
        </span>
      </div>

      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setTab("analysis")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "analysis" ? "border-sky-400 text-white" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => setTab("solution")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "solution" ? "border-sky-400 text-white" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Proposed Solution
        </button>
      </div>

      {tab === "analysis" && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.recommendation}</p>
          {result.sources.length > 0 && (
            <div>
              <p className="text-xs text-white/50 mb-1">Sources</p>
              <ul className="text-xs space-y-1">
                {result.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                      {s.title ?? s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "solution" && (
        <div className="space-y-3">
          {result.fixPlan.summary && <p className="text-sm text-white/70">{result.fixPlan.summary}</p>}

          {result.fixPlan.commands.length > 0 ? (
            <>
              <pre className="rounded bg-black/40 p-3 text-sm overflow-x-auto">{commandsText}</pre>

              {result.fixPlan.requiresConfirmation && (
                <p className="text-xs text-amber-400">
                  ⚠ This solution needs your confirmation before running — review carefully.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs rounded border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5"
                >
                  {copied ? "Copied ✓" : "Copy commands"}
                </button>
                <button
                  onClick={handleRunInSandbox}
                  disabled={running || !DEFAULT_REPO_PATH}
                  className="text-xs rounded border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 disabled:opacity-40"
                >
                  {running ? "Running..." : "Run in sandbox"}
                </button>
                <button
                  onClick={handleOpenInVSCode}
                  disabled={!DEFAULT_REPO_PATH}
                  className="text-xs rounded border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 disabled:opacity-40"
                >
                  Open in VS Code
                </button>
              </div>

              {!DEFAULT_REPO_PATH && (
                <p className="text-xs text-white/30">
                  Set NEXT_PUBLIC_DEFAULT_REPO_PATH in .env.local to enable these actions.
                </p>
              )}

              {runError && <p className="text-sm text-red-400">{runError}</p>}
              {runOutput && (
                <pre className="rounded bg-black/60 p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {runOutput}
                </pre>
              )}
            </>
          ) : (
            <p className="text-sm text-white/40">No commands proposed yet.</p>
          )}
        </div>
      )}
    </div>
  );
}