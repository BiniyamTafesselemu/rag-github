"use client";

import { useEffect, useState } from "react";
import { getSessions, type SessionRecord } from "@/lib/api";

export function History() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-white/40">Loading history...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-white/80">Recent sessions</h2>
      <div className="space-y-1">
        {sessions.map((s) => {
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
      </div>
    </div>
  );
}
