"use client";

import { useEffect, useState } from "react";
import { PROPERTY_TYPE_TAB_LABELS } from "@/lib/savedAnalysis";
import { formatCurrency, formatPercent } from "@/lib/format";

interface AdminAnalysis {
  id: string;
  propertyType: keyof typeof PROPERTY_TYPE_TAB_LABELS;
  label: string;
  address: string | null;
  ownerEmail: string;
  ownerName: string | null;
  updatedAt: string;
  capRatePercent: number | null;
  cashOnCashReturnPercent: number | null;
  monthlyCashFlow: number | null;
  verdictLabel: string | null;
}

export default function AdminAnalysesPage() {
  const [analyses, setAnalyses] = useState<AdminAnalysis[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function refresh(query: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/analyses${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load analyses.");
        return;
      }
      setAnalyses(json.analyses);
      setTruncated(!!json.truncated);
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  useEffect(() => {
    refresh("");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => refresh(q), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">All Saved Analyses</h1>
        <p className="mt-1 text-sm text-slate-500">
          {analyses ? `${analyses.length} analys${analyses.length === 1 ? "is" : "es"}` : "Loading…"}
          {truncated && " (showing first 500 — narrow with a search)"}
        </p>
      </header>

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by label, address, or owner email…"
        className="mb-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {error && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {analyses && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Label / Address</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Cap rate</th>
                <th className="px-4 py-3">CoC return</th>
                <th className="px-4 py-3">Cash flow</th>
                <th className="px-4 py-3">Verdict</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.label}</div>
                    {a.address && <div className="text-xs text-slate-500">{a.address}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.ownerName || a.ownerEmail}</td>
                  <td className="px-4 py-3 text-slate-600">{PROPERTY_TYPE_TAB_LABELS[a.propertyType]}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {a.capRatePercent !== null ? formatPercent(a.capRatePercent) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {a.cashOnCashReturnPercent !== null ? formatPercent(a.cashOnCashReturnPercent) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {a.monthlyCashFlow !== null ? formatCurrency(a.monthlyCashFlow) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.verdictLabel || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(a.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {analyses.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No analyses found.</p>
          )}
        </div>
      )}
    </div>
  );
}
