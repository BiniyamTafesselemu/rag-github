import type { AnalyzeResponse } from "@/lib/api";

const RISK_COLOR: Record<string, string> = {
  low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  high: "text-red-400 border-red-400/30 bg-red-400/10",
};

export function RecommendationCard({ result }: { result: AnalyzeResponse }) {
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

      <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.recommendation}</p>

      {result.fixPlan.commands.length > 0 && (
        <div>
          <p className="text-xs text-white/50 mb-1">Suggested commands</p>
          <pre className="rounded bg-black/40 p-3 text-sm overflow-x-auto">
            {result.fixPlan.commands.join("\n")}
          </pre>
        </div>
      )}

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
  );
}
