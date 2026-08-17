"use client";

import { useEffect, useState } from "react";
import type { SavedAnalysisSummary } from "@/lib/savedAnalysis";
import { PROPERTY_TYPE_TAB_LABELS } from "@/lib/savedAnalysis";
import { formatCurrency, formatPercent } from "@/lib/format";

const VERDICT_COLORS: Record<string, string> = {
  "Strong Buy": "bg-emerald-100 text-emerald-800",
  "Good Investment": "bg-teal-100 text-teal-800",
  "Marginal — Negotiate": "bg-amber-100 text-amber-800",
  Pass: "bg-rose-100 text-rose-800",
};

export function HistoryTab({
  onLoad,
}: {
  onLoad: (propertyType: string, id: string) => void;
}) {
  const [analyses, setAnalyses] = useState<SavedAnalysisSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/saved-analyses");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load your saved analyses.");
        return;
      }
      setAnalyses(json.analyses);
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved analysis? This can't be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/saved-analyses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnalyses((prev) => prev?.filter((a) => a.id !== id) ?? null);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(id: string, currentLabel: string) {
    const label = window.prompt("Rename this analysis", currentLabel);
    if (!label || label === currentLabel) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/saved-analyses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        setAnalyses((prev) =>
          prev?.map((a) => (a.id === id ? { ...a, label } : a)) ?? null
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Saved Analyses</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Every analysis you save from any tab shows up here. Click one to
          reload it into its calculator, or head to Portfolio to compare
          several side by side.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
          {error}
        </div>
      )}

      {analyses === null && !error && (
        <div className="text-sm text-slate-400">Loading…</div>
      )}

      {analyses && analyses.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-400">
          Nothing saved yet. Run an analysis on any tab and click "Save
          analysis" to keep it here.
        </div>
      )}

      {analyses && analyses.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Cash flow</th>
                <th className="px-4 py-2">Cap rate</th>
                <th className="px-4 py-2">CoC</th>
                <th className="px-4 py-2">Verdict</th>
                <th className="px-4 py-2">Saved</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onLoad(a.propertyType, a.id)}
                      className="font-medium text-slate-900 hover:underline text-left"
                    >
                      {a.label}
                    </button>
                    {a.address && <div className="text-xs text-slate-400">{a.address}</div>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {PROPERTY_TYPE_TAB_LABELS[a.propertyType]}
                  </td>
                  <td className={`px-4 py-2 tabular-nums ${(a.monthlyCashFlow ?? 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {a.monthlyCashFlow !== null ? formatCurrency(a.monthlyCashFlow) : "—"}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {a.capRatePercent !== null ? formatPercent(a.capRatePercent) : "—"}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {a.cashOnCashReturnPercent !== null ? formatPercent(a.cashOnCashReturnPercent) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {a.verdictLabel && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERDICT_COLORS[a.verdictLabel] ?? "bg-slate-100 text-slate-700"}`}>
                        {a.verdictLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-400">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => handleRename(a.id, a.label)}
                      className="text-xs text-slate-500 hover:text-slate-900 mr-3 disabled:opacity-50"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => handleDelete(a.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
