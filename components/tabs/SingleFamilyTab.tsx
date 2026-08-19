"use client";

import { useMemo, useState } from "react";
import { PropertyForm } from "@/components/PropertyForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";
import { PrintableReport } from "@/components/PrintableReport";
import { ScenarioToggle } from "@/components/ScenarioToggle";
import { DEFAULT_INPUTS } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { extractStateFromAddress, findStateFactor } from "@/lib/locationFactors";
import { useLoadSavedAnalysis } from "@/lib/useLoadSavedAnalysis";
import { runScenarioSingleFamily, SCENARIO_LABELS, type ScenarioKey } from "@/lib/sensitivity";
import type { PropertyInputs, CalculationResult, Verdict } from "@/lib/types";
import type { StateFactor } from "@/lib/locationFactors";

interface AnalyzeResponse {
  inputs: PropertyInputs;
  result: CalculationResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
  error?: string;
}

export function SingleFamilyTab({
  loadAnalysisId,
  loadNonce,
}: {
  loadAnalysisId?: string;
  loadNonce?: number;
}) {
  const [inputs, setInputs] = useState<PropertyInputs>(DEFAULT_INPUTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [scenario, setScenario] = useState<ScenarioKey>("base");

  const loadError = useLoadSavedAnalysis(loadAnalysisId, loadNonce, (saved) => {
    setInputs(saved.inputs);
    const stateAbbr = extractStateFromAddress(saved.inputs.address || "");
    setData({
      inputs: saved.inputs,
      result: saved.result,
      verdict: saved.verdict,
      stateFactor: stateAbbr ? findStateFactor(stateAbbr) : null,
    });
    setScenario("base");
    setError(null);
  });

  // Recomputed entirely client-side (analyzeProperty/evaluateVerdict are
  // pure functions) so switching scenarios is instant — no server round
  // trip, and the original submitted numbers in `data` are never mutated.
  const { result: displayResult, verdict: displayVerdict } = useMemo(() => {
    if (!data) return { result: null, verdict: null };
    if (scenario === "base") return { result: data.result, verdict: data.verdict };
    return runScenarioSingleFamily(data.inputs, scenario);
  }, [data, scenario]);

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
        setScenario("base");
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
          {loadError && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
              {loadError}
            </div>
          )}
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
          {data && displayResult && displayVerdict && (
            <>
              <AnalysisToolbar
                propertyType="single-family"
                address={data.inputs.address}
                inputs={data.inputs}
                result={data.result}
                verdict={data.verdict}
              />
              <div className="mb-4">
                <ScenarioToggle value={scenario} onChange={setScenario} />
              </div>
              <ResultsDashboard
                result={displayResult}
                verdict={displayVerdict}
                stateFactor={data.stateFactor}
              />
              <PrintableReport
                title={
                  scenario === "base"
                    ? "Single-Family Investment Analysis"
                    : `Single-Family Investment Analysis — ${SCENARIO_LABELS[scenario]} scenario`
                }
                address={data.inputs.address}
                verdict={displayVerdict}
                metrics={[
                  { label: "Monthly cash flow", value: formatCurrency(displayResult.monthlyCashFlow) },
                  { label: "Cash-on-cash return", value: formatPercent(displayResult.cashOnCashReturnPercent) },
                  { label: "Cap rate", value: formatPercent(displayResult.capRatePercent) },
                  { label: "DSCR", value: Number.isFinite(displayResult.dscr) ? displayResult.dscr.toFixed(2) : "∞" },
                  { label: "Cash needed to close", value: formatCurrency(displayResult.totalCashInvested) },
                  { label: "1% rule", value: formatPercent(displayResult.onePercentRulePercent, 2) },
                ]}
                tableTitle={`${displayResult.projection.length}-year projection`}
                tableHeaders={["Year", "Gross rent", "NOI", "Cash flow", "Property value", "Equity"]}
                tableRows={displayResult.projection.map((p) => [
                  String(p.year),
                  formatCurrency(p.grossRent),
                  formatCurrency(p.noi),
                  formatCurrency(p.cashFlow),
                  formatCurrency(p.propertyValue),
                  formatCurrency(p.equity),
                ])}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
