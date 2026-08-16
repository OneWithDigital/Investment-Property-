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

export function SingleFamilyTab() {
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
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Single-Family Analyzer</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Standard buy-and-hold rental analysis: cash flow, cap rate, cash-on-cash
          return, DSCR, the 1%/50% rules, and a multi-year projection.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
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
              Fill in the property details and click &quot;Analyze property&quot; to
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
    </div>
  );
}
