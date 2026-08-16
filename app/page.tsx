"use client";

import { useState } from "react";
import { PropertyForm } from "@/components/PropertyForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { DEFAULT_INPUTS } from "@/lib/calculations";
import type { PropertyInputs, CalculationResult, Verdict } from "@/lib/types";
import type { StateFactor } from "@/lib/locationFactors";

interface AnalyzeResponse {
  inputs: PropertyInputs;
  result: CalculationResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
  error?: string;
}

export default function Home() {
  const [inputs, setInputs] = useState<PropertyInputs>(DEFAULT_INPUTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const json: AnalyzeResponse = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong analyzing this property.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Couldn't reach the analysis service. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Investment Property Analyzer
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Paste a Zillow listing URL or an address, fill in the numbers, and
          get a full buy-and-hold rental analysis: cash flow, cap rate,
          cash-on-cash return, DSCR, the 1%/50% rules, a multi-year
          projection, and a verdict grounded in standard investor
          benchmarks.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
          <PropertyForm
            inputs={inputs}
            onChange={setInputs}
            onSubmit={handleAnalyze}
            loading={loading}
          />
        </div>

        <div>
          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
              {error}
            </div>
          )}
          {!data && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-400">
              Fill in the property details and click "Analyze property" to
              see the full breakdown.
            </div>
          )}
          {data && (
            <ResultsDashboard
              result={data.result}
              verdict={data.verdict}
              stateFactor={data.stateFactor}
            />
          )}
        </div>
      </div>

      <footer className="mt-10 text-xs text-slate-400 max-w-3xl">
        Educational tool, not financial or legal advice. Benchmarks (1% rule,
        50% rule, 8%+ cash-on-cash, 1.25+ DSCR, 6%+ cap rate) are common
        buy-and-hold rental heuristics popularized by investors like those at
        BiggerPockets — treat them as a starting filter, not a guarantee.
        Always verify rent comps, tax records, insurance quotes, and local
        landlord-tenant law before purchasing.
      </footer>
    </main>
  );
}
