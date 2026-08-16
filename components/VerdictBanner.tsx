"use client";

import type { Verdict } from "@/lib/types";

const STYLES: Record<Verdict["label"], { bg: string; border: string; text: string; dot: string }> = {
  "Strong Buy": {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-900",
    dot: "bg-emerald-600",
  },
  "Good Investment": {
    bg: "bg-teal-50",
    border: "border-teal-300",
    text: "text-teal-900",
    dot: "bg-teal-600",
  },
  "Marginal — Negotiate": {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-900",
    dot: "bg-amber-600",
  },
  Pass: {
    bg: "bg-rose-50",
    border: "border-rose-300",
    text: "text-rose-900",
    dot: "bg-rose-600",
  },
};

export function VerdictBanner({ verdict }: { verdict: Verdict }) {
  const style = STYLES[verdict.label];
  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${style.dot}`} />
          <h2 className={`text-xl font-bold ${style.text}`}>{verdict.label}</h2>
        </div>
        <div className={`text-sm font-semibold ${style.text} tabular-nums`}>
          Score: {verdict.score}/100
        </div>
      </div>
      <p className={`mt-2 text-sm ${style.text}`}>{verdict.summary}</p>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {verdict.criteria.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm">
            <span className={c.pass ? "text-emerald-600" : "text-rose-500"}>
              {c.pass ? "✓" : "✗"}
            </span>
            <span className="text-slate-700">
              <span className="font-medium">{c.label}</span>
              <span className="block text-xs text-slate-500">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
