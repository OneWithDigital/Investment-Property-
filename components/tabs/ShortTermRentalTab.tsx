"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_STR_INPUTS,
  STR_REGULATION_LABELS,
  type ShortTermRentalInputs,
  type ShortTermRentalResult,
  type StrRegulationRisk,
} from "@/lib/calc/shortTermRental";
import type { Verdict } from "@/lib/types";
import type { StateFactor } from "@/lib/locationFactors";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { FIELD_HELP, RESULT_HELP } from "@/lib/fieldHelp";
import { MetricCard } from "@/components/MetricCard";
import { VerdictBanner } from "@/components/VerdictBanner";
import { MlsLookupButton } from "@/components/MlsLookupButton";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";
import { PrintableReport } from "@/components/PrintableReport";
import { ScenarioToggle } from "@/components/ScenarioToggle";
import {
  runScenarioShortTermRental,
  scenarioInputsShortTermRental,
  SCENARIO_LABELS,
  type ScenarioKey,
} from "@/lib/sensitivity";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useLoadSavedAnalysis } from "@/lib/useLoadSavedAnalysis";

interface AnalyzeResponse {
  inputs: ShortTermRentalInputs;
  result: ShortTermRentalResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
  error?: string;
}

export function ShortTermRentalTab({
  loadAnalysisId,
  loadNonce,
}: {
  loadAnalysisId?: string;
  loadNonce?: number;
}) {
  const [inputs, setInputs] = useState<ShortTermRentalInputs>(DEFAULT_STR_INPUTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [scenario, setScenario] = useState<ScenarioKey>("base");

  const loadError = useLoadSavedAnalysis(loadAnalysisId, loadNonce, (saved) => {
    setInputs(saved.inputs);
    setData({ inputs: saved.inputs, result: saved.result, verdict: saved.verdict, stateFactor: null });
    setScenario("base");
    setError(null);
  });

  const { result: displayResult, verdict: displayVerdict } = useMemo(() => {
    if (!data) return { result: null, verdict: null };
    if (scenario === "base") return { result: data.result, verdict: data.verdict };
    return runScenarioShortTermRental(data.inputs, scenario);
  }, [data, scenario]);

  const displayInputs = useMemo(
    () => (data ? scenarioInputsShortTermRental(data.inputs, scenario) : null),
    [data, scenario]
  );

  const set = <K extends keyof ShortTermRentalInputs>(
    key: K,
    value: ShortTermRentalInputs[K]
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/short-term-rental", {
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
        <h1 className="text-xl font-bold text-slate-900">Short-Term Rental Analyzer</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          ADR × occupancy revenue modeling, platform/cleaning turnover
          economics, a break-even occupancy calculation, and a regulatory
          risk gate — STR deals carry more operational effort and
          regulatory exposure, so the bar here is intentionally higher.
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
          <MlsLookupButton
            address={inputs.address}
            onApply={(mls) => {
              if (mls.estimatedValue) set("purchasePrice", mls.estimatedValue);
              if (mls.estimatedRent) set("comparableLongTermMonthlyRent", mls.estimatedRent);
            }}
          />

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">STR regulation status</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              value={inputs.strRegulationRisk}
              onChange={(e) => set("strRegulationRisk", e.target.value as StrRegulationRisk)}
            >
              {Object.entries(STR_REGULATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Check your city/county's actual short-term rental ordinance.</span>
          </label>

          <SectionHeading>Purchase &amp; financing</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Purchase price" prefix="$" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} step={1000} info={FIELD_HELP.purchasePrice} />
            <NumberField label="Down payment" suffix="%" value={inputs.downPaymentPercent} onChange={(v) => set("downPaymentPercent", v)} step={1} info={FIELD_HELP.downPayment} />
            <NumberField label="Interest rate" suffix="%" value={inputs.interestRatePercent} onChange={(v) => set("interestRatePercent", v)} step={0.125} info={FIELD_HELP.interestRate} />
            <NumberField label="Loan term" suffix="yrs" value={inputs.loanTermYears} onChange={(v) => set("loanTermYears", v)} step={1} info={FIELD_HELP.loanTerm} />
            <NumberField label="Closing costs" suffix="%" value={inputs.closingCostPercent} onChange={(v) => set("closingCostPercent", v)} step={0.5} info={FIELD_HELP.closingCosts} />
            <NumberField label="Furnishing / setup" prefix="$" value={inputs.furnishingSetupCost} onChange={(v) => set("furnishingSetupCost", v)} step={500} help="Furniture, decor, kitchen setup, photos" />
          </div>

          <SectionHeading>Revenue assumptions</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Average daily rate" prefix="$" value={inputs.averageDailyRate} onChange={(v) => set("averageDailyRate", v)} step={5} info={FIELD_HELP.averageDailyRate} />
            <NumberField label="Occupancy" suffix="%" value={inputs.occupancyPercent} onChange={(v) => set("occupancyPercent", v)} step={1} info={FIELD_HELP.occupancyPercent} />
            <NumberField label="Avg nights / stay" value={inputs.avgNightsPerStay} onChange={(v) => set("avgNightsPerStay", v)} step={0.5} help="Affects turnover frequency, not revenue" />
            <NumberField label="Cleaning fee charged" prefix="$" suffix="/stay" value={inputs.cleaningFeePerStay} onChange={(v) => set("cleaningFeePerStay", v)} step={10} info={FIELD_HELP.cleaningFeeCharged} />
            <NumberField label="Cleaning cost" prefix="$" suffix="/stay" value={inputs.cleaningCostPerStay} onChange={(v) => set("cleaningCostPerStay", v)} step={10} info={FIELD_HELP.cleaningCost} />
            <NumberField label="Other monthly income" prefix="$" value={inputs.otherMonthlyIncome} onChange={(v) => set("otherMonthlyIncome", v)} step={25} info={FIELD_HELP.otherMonthlyIncome} />
          </div>
          <NumberField
            label="Comparable long-term rent"
            prefix="$"
            suffix="/mo"
            value={inputs.comparableLongTermMonthlyRent}
            onChange={(v) => set("comparableLongTermMonthlyRent", v)}
            step={25}
            help="For the STR-vs-LTR premium comparison"
            info={FIELD_HELP.comparableLongTermRent}
          />

          <SectionHeading>Operating expenses</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Platform fee" suffix="% of booking rev." value={inputs.platformFeePercent} onChange={(v) => set("platformFeePercent", v)} step={0.5} info={FIELD_HELP.platformFee} />
            <NumberField label="Co-host / management" suffix="% of revenue" value={inputs.managementPercent} onChange={(v) => set("managementPercent", v)} step={1} help="0 if self-managing" info={FIELD_HELP.strManagementPercent} />
            <NumberField label="Supplies" prefix="$" suffix="/mo" value={inputs.suppliesMonthly} onChange={(v) => set("suppliesMonthly", v)} step={10} help="Toiletries, coffee, paper goods, welcome basket" />
            <NumberField label="Utilities" prefix="$" suffix="/mo" value={inputs.utilitiesMonthlyOwnerPaid} onChange={(v) => set("utilitiesMonthlyOwnerPaid", v)} step={10} help="STR always owner-paid" />
            <NumberField label="Internet / streaming" prefix="$" suffix="/mo" value={inputs.internetCableMonthly} onChange={(v) => set("internetCableMonthly", v)} step={10} />
            <NumberField label="Other opex" prefix="$" suffix="/mo" value={inputs.otherMonthlyOperatingCosts} onChange={(v) => set("otherMonthlyOperatingCosts", v)} step={10} help="Pool, lawn, pest control" />
            <NumberField label="Property tax" prefix="$" suffix="/yr" value={inputs.propertyTaxAnnual} onChange={(v) => set("propertyTaxAnnual", v)} step={100} info={FIELD_HELP.propertyTax} />
            <NumberField label="Insurance (STR policy)" prefix="$" suffix="/yr" value={inputs.insuranceAnnual} onChange={(v) => set("insuranceAnnual", v)} step={100} help="STR policies cost more than standard landlord insurance" />
            <NumberField label="HOA" prefix="$" suffix="/mo" value={inputs.hoaMonthly} onChange={(v) => set("hoaMonthly", v)} step={10} help="Check HOA STR restrictions" />
            <NumberField label="STR permit/license fee" prefix="$" suffix="/yr" value={inputs.strPermitAnnualFee} onChange={(v) => set("strPermitAnnualFee", v)} step={50} help="Separate from any lodging/occupancy tax, which typically passes through to the guest" />
            <NumberField label="Maintenance" suffix="% of revenue" value={inputs.maintenancePercent} onChange={(v) => set("maintenancePercent", v)} step={0.5} info={FIELD_HELP.maintenancePercent} />
            <NumberField label="CapEx reserve" suffix="% of revenue" value={inputs.capExPercent} onChange={(v) => set("capExPercent", v)} step={0.5} info={FIELD_HELP.capExPercent} />
          </div>

          <SectionHeading>Growth &amp; exit</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Revenue growth" suffix="%/yr" value={inputs.annualRevenueGrowthPercent} onChange={(v) => set("annualRevenueGrowthPercent", v)} step={0.5} info={FIELD_HELP.rentGrowth} />
            <NumberField label="Expense growth" suffix="%/yr" value={inputs.annualExpenseGrowthPercent} onChange={(v) => set("annualExpenseGrowthPercent", v)} step={0.5} info={FIELD_HELP.expenseGrowth} />
            <NumberField label="Appreciation" suffix="%/yr" value={inputs.annualAppreciationPercent} onChange={(v) => set("annualAppreciationPercent", v)} step={0.5} info={FIELD_HELP.appreciation} />
            <NumberField label="Selling costs" suffix="%" value={inputs.sellingCostPercent} onChange={(v) => set("sellingCostPercent", v)} step={0.5} info={FIELD_HELP.sellingCosts} />
            <NumberField label="Hold period" suffix="yrs" value={inputs.holdPeriodYears} onChange={(v) => set("holdPeriodYears", v)} step={1} info={FIELD_HELP.holdPeriod} />
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
              Fill in the revenue and expense assumptions, then analyze.
            </div>
          )}
          {data && displayResult && displayVerdict && displayInputs && (
            <>
              <AnalysisToolbar
                propertyType="short-term-rental"
                address={data.inputs.address}
                inputs={data.inputs}
                result={data.result}
                verdict={data.verdict}
              />
              <div className="mb-4">
                <ScenarioToggle value={scenario} onChange={setScenario} />
              </div>
              <ShortTermRentalResults result={displayResult} verdict={displayVerdict} inputs={displayInputs} />
              <PrintableReport
                title={
                  scenario === "base"
                    ? "Short-Term Rental Investment Analysis"
                    : `Short-Term Rental Investment Analysis — ${SCENARIO_LABELS[scenario]} scenario`
                }
                address={data.inputs.address}
                verdict={displayVerdict}
                metrics={[
                  { label: "Monthly cash flow", value: formatCurrency(displayResult.monthlyCashFlow) },
                  { label: "Cash-on-cash return", value: formatPercent(displayResult.cashOnCashReturnPercent) },
                  { label: "Cap rate", value: formatPercent(displayResult.capRatePercent) },
                  { label: "DSCR", value: Number.isFinite(displayResult.dscr) ? displayResult.dscr.toFixed(2) : "∞" },
                  { label: "Cash needed to close", value: formatCurrency(displayResult.totalCashInvested) },
                  {
                    label: "Break-even occupancy",
                    value: Number.isFinite(displayResult.breakEvenOccupancyPercent)
                      ? formatPercent(displayResult.breakEvenOccupancyPercent, 0)
                      : "—",
                  },
                ]}
                tableTitle={`${displayResult.projection.length}-year projection`}
                tableHeaders={["Year", "Booking revenue", "NOI", "Cash flow", "Property value", "Equity"]}
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

function ShortTermRentalResults({
  result,
  verdict,
  inputs,
}: {
  result: ShortTermRentalResult;
  verdict: Verdict;
  inputs: ShortTermRentalInputs;
}) {
  return (
    <div className="space-y-6">
      <VerdictBanner verdict={verdict} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Monthly cash flow" value={formatCurrency(result.monthlyCashFlow)} tone={result.monthlyCashFlow >= 0 ? "positive" : "negative"} />
        <MetricCard label="Cash-on-cash return" value={formatPercent(result.cashOnCashReturnPercent)} tone={result.cashOnCashReturnPercent >= 12 ? "positive" : "negative"} help="STR target: 12%+" info={RESULT_HELP.cashOnCash} />
        <MetricCard label="Cap rate" value={formatPercent(result.capRatePercent)} tone={result.capRatePercent >= 6 ? "positive" : "negative"} info={RESULT_HELP.capRate} />
        <MetricCard label="DSCR" value={Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞"} tone={result.dscr >= 1.25 ? "positive" : "negative"} info={RESULT_HELP.dscr} />
        <MetricCard label="Cash needed to close" value={formatCurrency(result.totalCashInvested)} help="Down + closing + furnishing" />
        <MetricCard
          label="Break-even occupancy"
          value={Number.isFinite(result.breakEvenOccupancyPercent) ? formatPercent(result.breakEvenOccupancyPercent, 0) : "—"}
          tone={result.breakEvenOccupancyPercent <= inputs.occupancyPercent - 15 ? "positive" : "negative"}
          help={`vs. ${inputs.occupancyPercent}% assumption`}
          info={RESULT_HELP.breakEvenOccupancy}
        />
        <MetricCard label="Revenue / available night" value={formatCurrency(result.revenuePerAvailableNight, 2)} info={RESULT_HELP.revenuePerAvailableNight} />
        <MetricCard label="Gross booking revenue" value={formatCurrency(result.grossBookingRevenueAnnual)} help="Annual" info={RESULT_HELP.grossBookingRevenue} />
      </div>

      {result.strPremiumMonthly !== null && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <h3 className="text-sm font-semibold text-indigo-900">STR vs. long-term rental</h3>
          <p className="mt-1 text-sm text-indigo-800">
            Running this as an STR nets you approximately{" "}
            <strong>{formatCurrency(Math.abs(result.strPremiumMonthly))}/month {result.strPremiumMonthly >= 0 ? "more" : "less"}</strong>{" "}
            than a rough long-term-rental equivalent at ${inputs.comparableLongTermMonthlyRent.toFixed(0)}/mo (assuming ~15% combined
            LTR maintenance/capex/vacancy/management costs). Weigh that premium against the extra operational effort and regulatory risk.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h3 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
          {result.projection.length}-year projection &amp; exit
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">Booking revenue</th>
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
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.grossRent)}</td>
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
          <MetricCard label="Net sale proceeds" value={formatCurrency(result.netSaleProceedsAtExit)} info={RESULT_HELP.netSaleProceeds} />
          <MetricCard label="Total profit at exit" value={formatCurrency(result.totalReturnAtExit)} tone={result.totalReturnAtExit >= 0 ? "positive" : "negative"} />
          <MetricCard label="Equity multiple" value={`${result.equityMultiple.toFixed(2)}x`} info={RESULT_HELP.equityMultiple} />
          <MetricCard label="IRR" value={result.irrPercent !== null ? formatPercent(result.irrPercent) : "—"} tone={result.irrPercent !== null ? (result.irrPercent >= 12 ? "positive" : "negative") : "neutral"} info={RESULT_HELP.irr} />
        </div>
      </div>
    </div>
  );
}
