"use client";

import { useEffect, useMemo, useState } from "react";
import type { SavedAnalysisSummary } from "@/lib/savedAnalysis";
import { PROPERTY_TYPE_TAB_LABELS } from "@/lib/savedAnalysis";
import { formatCurrency, formatPercent } from "@/lib/format";

type SortKey = "capRatePercent" | "cashOnCashReturnPercent" | "monthlyCashFlow" | "dscr";

const SORT_LABELS: Record<SortKey, string> = {
  capRatePercent: "Cap rate",
  cashOnCashReturnPercent: "Cash-on-cash return",
  monthlyCashFlow: "Monthly cash flow",
  dscr: "DSCR",
};

export function PortfolioTab() {
  const [analyses, setAnalyses] = useState<SavedAnalysisSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("cashOnCashReturnPercent");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const sorted = useMemo(() => {
    if (!analyses) return [];
    return [...analyses].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return bv - av;
    });
  }, [analyses, sortKey]);

  const selectedAnalyses = sorted.filter((a) => selected.has(a.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Portfolio &amp; Comparison</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Every saved analysis across all property types, ranked by the
          metric you care about most. Check a few boxes to compare deals
          side by side.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
          {error}
        </div>
      )}
      {analyses === null && !error && <div className="text-sm text-slate-400">Loading…</div>}
      {analyses && analyses.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-400">
          Nothing saved yet. Save an analysis from any calculator tab to see
          it here.
        </div>
      )}

      {analyses && analyses.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-slate-500">Rank by</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-6">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2 w-8" />
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Cash flow</th>
                  <th className="px-4 py-2">Cap rate</th>
                  <th className="px-4 py-2">CoC</th>
                  <th className="px-4 py-2">DSCR</th>
                  <th className="px-4 py-2">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{a.label}</td>
                    <td className="px-4 py-2 text-slate-600">{PROPERTY_TYPE_TAB_LABELS[a.propertyType]}</td>
                    <td className={`px-4 py-2 tabular-nums ${(a.monthlyCashFlow ?? 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {a.monthlyCashFlow !== null ? formatCurrency(a.monthlyCashFlow) : "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {a.capRatePercent !== null ? formatPercent(a.capRatePercent) : "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {a.cashOnCashReturnPercent !== null ? formatPercent(a.cashOnCashReturnPercent) : "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {a.dscr !== null && Number.isFinite(a.dscr) ? a.dscr.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{a.verdictLabel ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {selectedAnalyses.length > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
              <h2 className="text-sm font-semibold text-indigo-900 mb-3">
                Comparing {selectedAnalyses.length} propert{selectedAnalyses.length === 1 ? "y" : "ies"}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                      <th className="px-3 py-2">Metric</th>
                      {selectedAnalyses.map((a) => (
                        <th key={a.id} className="px-3 py-2">{a.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500">Type</td>
                      {selectedAnalyses.map((a) => (
                        <td key={a.id} className="px-3 py-2">{PROPERTY_TYPE_TAB_LABELS[a.propertyType]}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500">Monthly cash flow</td>
                      {selectedAnalyses.map((a) => (
                        <td key={a.id} className={`px-3 py-2 tabular-nums ${(a.monthlyCashFlow ?? 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                          {a.monthlyCashFlow !== null ? formatCurrency(a.monthlyCashFlow) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500">Cap rate</td>
                      {selectedAnalyses.map((a) => (
                        <td key={a.id} className="px-3 py-2 tabular-nums">
                          {a.capRatePercent !== null ? formatPercent(a.capRatePercent) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500">Cash-on-cash return</td>
                      {selectedAnalyses.map((a) => (
                        <td key={a.id} className="px-3 py-2 tabular-nums">
                          {a.cashOnCashReturnPercent !== null ? formatPercent(a.cashOnCashReturnPercent) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500">DSCR</td>
                      {selectedAnalyses.map((a) => (
                        <td key={a.id} className="px-3 py-2 tabular-nums">
                          {a.dscr !== null && Number.isFinite(a.dscr) ? a.dscr.toFixed(2) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-slate-500">Verdict</td>
                      {selectedAnalyses.map((a) => (
                        <td key={a.id} className="px-3 py-2">{a.verdictLabel ?? "—"}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
