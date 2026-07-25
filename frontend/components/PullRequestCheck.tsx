"use client";

import { useState } from "react";
import { checkMergeability, type Mergeability } from "@/lib/api";

const STATE_COLOR: Record<string, string> = {
  clean: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  dirty: "text-red-400 border-red-400/30 bg-red-400/10",
  blocked: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  unstable: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

export function PullRequestCheck() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Mergeability | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    if (!owner || !repo || !prNumber) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await checkMergeability(owner, repo, Number(prNumber));
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
      <h2 className="text-sm font-medium text-white/80">Check a PR's mergeability</h2>

      <div className="grid grid-cols-3 gap-2">
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="owner"
          className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm outline-none placeholder:text-white/30"
        />
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="repo"
          className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm outline-none placeholder:text-white/30"
        />
        <input
          value={prNumber}
          onChange={(e) => setPrNumber(e.target.value)}
          placeholder="PR #"
          className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm outline-none placeholder:text-white/30"
        />
      </div>

      <button
        onClick={handleCheck}
        disabled={loading || !owner || !repo || !prNumber}
        className="w-full rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {loading ? "Checking..." : "Check mergeability"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className={`text-sm px-3 py-2 rounded border ${STATE_COLOR[result.mergeableState] ?? "border-white/10"}`}>
          <span className="font-medium">{result.mergeableState}</span>
          {" — "}
          {result.mergeable === true && "safe to merge"}
          {result.mergeable === false && "has conflicts or is blocked"}
          {result.mergeable === null && "GitHub is still computing this"}
        </div>
      )}
    </div>
  );
}
