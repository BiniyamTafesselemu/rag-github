"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessions, type SessionRecord } from "@/lib/api";

const INITIAL_COUNT = 5;

export function History() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return sessions;
    const q = query.toLowerCase();
    return sessions.filter(
      (s) =>
        s.error_text.toLowerCase().includes(q) ||
        s.classification.toLowerCase().includes(q) ||
        s.recommendation.toLowerCase().includes(q)
    );
  }, [sessions, query]);

  const visible = showAll || query.trim() ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = !query.trim() && filtered.length > INITIAL_COUNT;

  if (loading) return <p className="text-sm text-white/40">Loading history...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-white/80">Recent sessions</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search history..."
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs outline-none placeholder:text-white/30"
      />

      <div className="space-y-1">
        {visible.map((s) => {
          const isOpen = expandedId === s.id;
          return (
            <div key={s.id} className="rounded-lg border border-white/10 bg-white/5">
              <button
                onClick={() => setExpandedId(isOpen ? null : s.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
              >
                <span className="text-xs text-white/70 truncate max-w-[70%]">
                  {s.error_text.slice(0, 60)}
                </span>
                <span className="text-xs text-white/40">
                  {s.classification.replaceAll("_", " ")}
                </span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
                  <p className="text-xs text-white/50">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{s.recommendation}</p>
                  {s.suggested_commands.length > 0 && (
                    <pre className="rounded bg-black/40 p-2 text-xs overflow-x-auto">
                      {s.suggested_commands.join("\n")}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-white/40 px-1">No matching sessions.</p>
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-1 text-xs text-white/50 hover:text-white/80 py-1"
        >
          Show {filtered.length - INITIAL_COUNT} more
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="mt-0.5">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      )}

      {showAll && !query.trim() && filtered.length > INITIAL_COUNT && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full flex items-center justify-center gap-1 text-xs text-white/50 hover:text-white/80 py-1"
        >
          Show less
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="mt-0.5 rotate-180">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      )}
    </div>
  );
}