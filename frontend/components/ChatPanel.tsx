"use client";

import { useState } from "react";
import { analyze, analyzeStream, type AnalyzeResponse, type FixPlan } from "@/lib/api";
import { TerminalView } from "./TerminalView";
import { RecommendationCard } from "./RecommendationCard";
import { PullRequestCheck } from "./PullRequestCheck";
import { LiveTerminal } from "./LiveTerminal";
import { History } from "./History";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

 async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    let classification = "";
    let sources: { url: string; title: string | null }[] = [];
    let recommendation = "";

    await analyzeStream(
      { terminalOutput: input, repo: repo || undefined },
      {
        onClassification: (c) => {
          classification = c;
          setResult({ classification, sources, recommendation, fixPlan: { summary: "", commands: [], risk: "low", requiresConfirmation: false } });
        },
        onSources: (s) => {
          sources = s;
          setResult((prev) => (prev ? { ...prev, sources } : prev));
        },
        onToken: (token) => {
          recommendation += token;
          setResult((prev) => (prev ? { ...prev, recommendation } : prev));
        },
        onFixPlan: (fixPlan: FixPlan) => {
          setResult((prev) => (prev ? { ...prev, fixPlan } : prev));
        },
        onDone: () => setLoading(false),
        onError: (err) => {
          setError(err);
          setLoading(false);
        },
      }
    );
  }

  return (
    <div className="flex max-w-6xl mx-auto py-10 px-4 gap-8">
      <aside className="w-72 shrink-0 hidden lg:block">
        <History />
      </aside>

      <div className="flex-1 max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">GitHub Error Assistant</h1>
          <p className="text-white/50 text-sm mt-1">
            Paste an error (or a diff with no error) and get a grounded recommendation.
          </p>
        </header>

        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo (optional)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30"
        />

        <TerminalView value={input} onChange={setInput} />

        <LiveTerminal onAnalyze={(output) => setInput(output)} />

        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && <RecommendationCard result={result} />}

        <PullRequestCheck />
      </div>
    </div>
  );
}
