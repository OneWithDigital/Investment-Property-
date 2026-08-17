"use client";

import { useState } from "react";
import {
  DEFAULT_MULTI_UNIT_INPUTS,
  type MultiUnitInputs,
  type MultiUnitResult,
  type UnitType,
} from "@/lib/calc/multiUnit";
import type { Verdict } from "@/lib/types";
import type { StateFactor } from "@/lib/locationFactors";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { MetricCard } from "@/components/MetricCard";
import { VerdictBanner } from "@/components/VerdictBanner";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";
import { PrintableReport } from "@/components/PrintableReport";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useLoadSavedAnalysis } from "@/lib/useLoadSavedAnalysis";

interface AnalyzeResponse {
  inputs: MultiUnitInputs;
  result: MultiUnitResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
  error?: string;
}

function UnitTypeRow({
  unitType,
  onChange,
  onRemove,
  removable,
}: {
  unitType: UnitType;
  onChange: (u: UnitType) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
      <input
        type="text"
        className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        value={unitType.label}
        onChange={(e) => onChange({ ...unitType, label: e.target.value })}
      />
      <div className="flex items-center rounded border border-slate-300">
        <input
          type="number"
          className="w-14 px-2 py-1.5 text-sm outline-none tabular-nums"
          value={unitType.count}
          min={0}
          onChange={(e) => onChange({ ...unitType, count: e.target.valueAsNumber || 0 })}
        />
        <span className="pr-2 text-slate-400 text-xs">units</span>
      </div>
      <div className="flex items-center rounded border border-slate-300 flex-1">
        <span className="pl-2 text-slate-400 text-sm">$</span>
        <input
          type="number"
          className="w-full px-2 py-1.5 text-sm outline-none tabular-nums"
          value={unitType.avgMonthlyRent}
          onChange={(e) => onChange({ ...unitType, avgMonthlyRent: e.target.valueAsNumber || 0 })}
        />
        <span className="pr-2 text-slate-400 text-xs">/mo avg</span>
      </div>
      {removable && (
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 text-sm px-1">
          ✕
        </button>
      )}
    </div>
  );
}

export function MultiUnitTab({
  loadAnalysisId,
  loadNonce,
}: {
  loadAnalysisId?: string;
  loadNonce?: number;
}) {
  const [inputs, setInputs] = useState<MultiUnitInputs>(DEFAULT_MULTI_UNIT_INPUTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const loadError = useLoadSavedAnalysis(loadAnalysisId, loadNonce, (saved) => {
    setInputs(saved.inputs);
    setData({ inputs: saved.inputs, result: saved.result, verdict: saved.verdict, stateFactor: null });
    setError(null);
  });

  const set = <K extends keyof MultiUnitInputs>(key: K, value: MultiUnitInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  function updateUnitType(index: number, u: UnitType) {
    const unitMix = [...inputs.unitMix];
    unitMix[index] = u;
    set("unitMix", unitMix);
  }

  function addUnitType() {
    set("unitMix", [...inputs.unitMix, { label: "New type", count: 1, avgMonthlyRent: 1200 }]);
  }

  function removeUnitType(index: number) {
    set("unitMix", inputs.unitMix.filter((_, i) => i !== index));
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/multi-unit", {
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

  const totalUnits = inputs.unitMix.reduce((sum, u) => sum + u.count, 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Multi-Unit Analyzer (5+ Units)</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Apartment-style underwriting: valued by the income approach (NOI ÷ cap
          rate) rather than comps, with commercial loan terms (separate
          amortization and loan maturity) and DSCR-driven lender criteria.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20 space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Address</span>
            <input
              type="text"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              value={inputs.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Main St, Austin, TX"
            />
          </label>

          <NumberField label="Purchase price" prefix="$" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} step={5000} />

          <SectionHeading>Unit mix ({totalUnits} units)</SectionHeading>
          <div className="overflow-x-auto">
          <div className="space-y-2 min-w-[380px]">
            {inputs.unitMix.map((u, i) => (
              <UnitTypeRow
                key={i}
                unitType={u}
                onChange={(nu) => updateUnitType(i, nu)}
                onRemove={() => removeUnitType(i)}
                removable={inputs.unitMix.length > 1}
              />
            ))}
          </div>
          </div>
          <button type="button" onClick={addUnitType} className="text-xs font-medium text-slate-600 hover:text-slate-900">
            + Add unit type
          </button>
          <NumberField label="Other monthly income" prefix="$" value={inputs.otherMonthlyIncome} onChange={(v) => set("otherMonthlyIncome", v)} step={25} help="Laundry, parking, storage, fees" />

          <SectionHeading>Financing (commercial)</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Down payment" suffix="%" value={inputs.downPaymentPercent} onChange={(v) => set("downPaymentPercent", v)} step={1} />
            <NumberField label="Interest rate" suffix="%" value={inputs.interestRatePercent} onChange={(v) => set("interestRatePercent", v)} step={0.125} />
            <NumberField label="Amortization" suffix="yrs" value={inputs.amortizationYears} onChange={(v) => set("amortizationYears", v)} step={1} help="Payment schedule" />
            <NumberField label="Loan term" suffix="yrs" value={inputs.loanTermYears} onChange={(v) => set("loanTermYears", v)} step={1} help="Until balloon/maturity" />
            <NumberField label="Closing costs" suffix="%" value={inputs.closingCostPercent} onChange={(v) => set("closingCostPercent", v)} step={0.5} />
            <NumberField label="Rehab / value-add budget" prefix="$" value={inputs.rehabCost} onChange={(v) => set("rehabCost", v)} step={1000} />
          </div>

          <SectionHeading>Operating expenses</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Property tax" prefix="$" suffix="/yr" value={inputs.propertyTaxAnnual} onChange={(v) => set("propertyTaxAnnual", v)} step={500} />
            <NumberField label="Insurance" prefix="$" suffix="/yr" value={inputs.insuranceAnnual} onChange={(v) => set("insuranceAnnual", v)} step={500} />
            <NumberField label="Payroll (onsite staff)" prefix="$" suffix="/yr" value={inputs.payrollAnnual} onChange={(v) => set("payrollAnnual", v)} step={1000} />
            <NumberField label="Common area utilities" prefix="$" suffix="/mo" value={inputs.commonAreaUtilitiesMonthly} onChange={(v) => set("commonAreaUtilitiesMonthly", v)} step={50} />
            <NumberField label="Other opex" prefix="$" suffix="/mo" value={inputs.otherOpExMonthly} onChange={(v) => set("otherOpExMonthly", v)} step={50} help="Landscaping, trash, pest control" />
            <NumberField label="Management" suffix="% of EGI" value={inputs.managementPercent} onChange={(v) => set("managementPercent", v)} step={0.5} />
            <NumberField label="Economic vacancy" suffix="%" value={inputs.economicVacancyPercent} onChange={(v) => set("economicVacancyPercent", v)} step={0.5} help="Vacancy + concessions + bad debt" />
            <NumberField label="CapEx reserve" prefix="$" suffix="/unit/yr" value={inputs.capExReservePerUnitAnnual} onChange={(v) => set("capExReservePerUnitAnnual", v)} step={25} />
          </div>

          <SectionHeading>Valuation &amp; exit</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Market cap rate" suffix="%" value={inputs.marketCapRatePercent} onChange={(v) => set("marketCapRatePercent", v)} step={0.1} help="For implied-value comparison" />
            <NumberField label="Exit cap rate" suffix="%" value={inputs.exitCapRatePercent} onChange={(v) => set("exitCapRatePercent", v)} step={0.1} />
            <NumberField label="Rent growth" suffix="%/yr" value={inputs.annualRentGrowthPercent} onChange={(v) => set("annualRentGrowthPercent", v)} step={0.5} />
            <NumberField label="Expense growth" suffix="%/yr" value={inputs.annualExpenseGrowthPercent} onChange={(v) => set("annualExpenseGrowthPercent", v)} step={0.5} />
            <NumberField label="Selling costs" suffix="%" value={inputs.sellingCostPercent} onChange={(v) => set("sellingCostPercent", v)} step={0.5} />
            <NumberField label="Hold period" suffix="yrs" value={inputs.holdPeriodYears} onChange={(v) => set("holdPeriodYears", v)} step={1} />
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze property"}
          </button>
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
              Fill in the unit mix and financing details, then analyze.
            </div>
          )}
          {data && (
            <>
              <AnalysisToolbar
                propertyType="multi-unit"
                address={data.inputs.address}
                inputs={data.inputs}
                result={data.result}
                verdict={data.verdict}
              />
              <MultiUnitResults result={data.result} verdict={data.verdict} />
              <PrintableReport
                title="Multi-Unit Investment Analysis"
                address={data.inputs.address}
                verdict={data.verdict}
                metrics={[
                  { label: "Monthly cash flow", value: formatCurrency(data.result.monthlyCashFlow) },
                  { label: "Cash-on-cash return", value: formatPercent(data.result.cashOnCashReturnPercent) },
                  { label: "Cap rate (going-in)", value: formatPercent(data.result.capRatePercent) },
                  { label: "DSCR", value: Number.isFinite(data.result.dscr) ? data.result.dscr.toFixed(2) : "∞" },
                  { label: "Price per unit", value: formatCurrency(data.result.pricePerUnit) },
                  { label: "Expense ratio", value: formatPercent(data.result.expenseRatioPercent) },
                ]}
                tableTitle={`${data.result.projection.length}-year projection`}
                tableHeaders={["Year", "GPR", "NOI", "Cash flow", "Property value", "Equity"]}
                tableRows={data.result.projection.map((p) => [
                  String(p.year),
                  formatCurrency(p.grossPotentialRent),
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

function MultiUnitResults({ result, verdict }: { result: MultiUnitResult; verdict: Verdict }) {
  return (
    <div className="space-y-6">
      <VerdictBanner verdict={verdict} />

      {result.balloonRisk && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your loan term is shorter than your hold period — you'll need to
          refinance or sell before the loan matures.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Monthly cash flow" value={formatCurrency(result.monthlyCashFlow)} tone={result.monthlyCashFlow >= 0 ? "positive" : "negative"} />
        <MetricCard label="Cash-on-cash return" value={formatPercent(result.cashOnCashReturnPercent)} tone={result.cashOnCashReturnPercent >= 8 ? "positive" : "negative"} />
        <MetricCard label="Cap rate (going-in)" value={formatPercent(result.capRatePercent)} />
        <MetricCard label="DSCR" value={Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞"} tone={result.dscr >= 1.25 ? "positive" : "negative"} />
        <MetricCard label="Implied value (at market cap rate)" value={formatCurrency(result.impliedValue)} />
        <MetricCard
          label="vs. purchase price"
          value={`${result.overUnderPricedPercent >= 0 ? "+" : ""}${result.overUnderPricedPercent.toFixed(1)}%`}
          tone={result.overUnderPricedPercent <= 0 ? "positive" : "negative"}
          help="Negative = priced below implied value"
        />
        <MetricCard label="Price per unit" value={formatCurrency(result.pricePerUnit)} />
        <MetricCard label="Expense ratio" value={formatPercent(result.expenseRatioPercent)} tone={result.expenseRatioPercent <= 55 ? "positive" : "negative"} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h3 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
          {result.projection.length}-year projection (valued via NOI ÷ exit cap rate) &amp; exit
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">GPR</th>
                <th className="px-4 py-2">NOI</th>
                <th className="px-4 py-2">Cash flow</th>
                <th className="px-4 py-2">Property value</th>
                <th className="px-4 py-2">Equity</th>
              </tr>
            </thead>
            <tbody>
              {result.projection.map((p) => (
                <tr key={p.year} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium">{p.year}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.grossPotentialRent)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.noi)}</td>
                  <td className={`px-4 py-2 tabular-nums ${p.cashFlow >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(p.cashFlow)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.propertyValue)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <MetricCard label="Net sale proceeds" value={formatCurrency(result.netSaleProceedsAtExit)} />
          <MetricCard label="Total profit at exit" value={formatCurrency(result.totalReturnAtExit)} tone={result.totalReturnAtExit >= 0 ? "positive" : "negative"} />
          <MetricCard label="Equity multiple" value={`${result.equityMultiple.toFixed(2)}x`} />
          <MetricCard label="IRR" value={result.irrPercent !== null ? formatPercent(result.irrPercent) : "—"} tone={result.irrPercent !== null ? (result.irrPercent >= 12 ? "positive" : "negative") : "neutral"} />
        </div>
      </div>
    </div>
  );
}
