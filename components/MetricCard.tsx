"use client";

import type { FieldHelpEntry } from "@/lib/fieldHelp";
import { InfoHint } from "./InfoHint";

export function MetricCard({
  label,
  value,
  help,
  tone = "neutral",
  info,
}: {
  label: string;
  value: string;
  help?: string;
  tone?: "neutral" | "positive" | "negative";
  /** "What is this, and why does it matter?" — rendered as a click-to-reveal box next to the label. */
  info?: FieldHelpEntry;
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-rose-600"
      : "text-slate-900";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {info && <InfoHint title={info.title} body={info.body} />}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {help && <div className="mt-1 text-xs text-slate-400">{help}</div>}
    </div>
  );
}
