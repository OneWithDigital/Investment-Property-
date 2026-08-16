"use client";

export function MetricCard({
  label,
  value,
  help,
  tone = "neutral",
}: {
  label: string;
  value: string;
  help?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-rose-600"
      : "text-slate-900";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {help && <div className="mt-1 text-xs text-slate-400">{help}</div>}
    </div>
  );
}
