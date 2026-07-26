"use client";

import { useState } from "react";
import type { AnalyzeResponse } from "@/lib/api";

const RISK_COLOR: Record<string, string> = {
  low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  high: "text-red-400 border-red-400/30 bg-red-400/10",
};

export function RecommendationCard({ result }: { result: AnalyzeResponse }) {
  const [tab, setTab] = useState<"analysis" | "solution">("analysis");

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
            tab === "analysis"
              ? "border-sky-400 text-white"
              : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => setTab("solution")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "solution"
              ? "border-sky-400 text-white"
              : "border-transparent text-white/40 hover:text-white/70"
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
        <div className="space-y-2">
          {result.fixPlan.summary && (
            <p className="text-sm text-white/70">{result.fixPlan.summary}</p>
          )}
          {result.fixPlan.commands.length > 0 ? (
            <pre className="rounded bg-black/40 p-3 text-sm overflow-x-auto">
              {result.fixPlan.commands.join("\n")}
            </pre>
          ) : (
            <p className="text-sm text-white/40">No commands proposed yet.</p>
          )}
          {result.fixPlan.requiresConfirmation && (
            <p className="text-xs text-amber-400">
              ⚠ This solution needs your confirmation before running — review carefully.
            </p>
          )}
        </div>
      )}
    </div>
  );
}