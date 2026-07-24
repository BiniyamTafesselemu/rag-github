"use client";

export function TerminalView({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/60 p-4">
      <p className="text-xs text-white/50 mb-2">Paste terminal output or a diff</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`$ git push origin main\n! [rejected]  main -> main (fetch first)\nerror: failed to push some refs...`}
        rows={10}
        className="w-full bg-transparent font-mono text-sm text-emerald-300 outline-none resize-none placeholder:text-white/30"
      />
    </div>
  );
}
