"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_COMMERCIAL_INPUTS,
  DEFAULT_REIMBURSEMENT_PERCENT,
  LEASE_STRUCTURE_LABELS,
  type CommercialInputs,
  type CommercialResult,
  type CommercialTenant,
  type LeaseStructure,
} from "@/lib/calc/commercial";
import type { Verdict } from "@/lib/types";
import type { StateFactor } from "@/lib/locationFactors";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { FIELD_HELP, RESULT_HELP } from "@/lib/fieldHelp";
import { MetricCard } from "@/components/MetricCard";
import { VerdictBanner } from "@/components/VerdictBanner";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";
import { PrintableReport } from "@/components/PrintableReport";
import { ScenarioToggle } from "@/components/ScenarioToggle";
import { runScenarioCommercial, SCENARIO_LABELS, type ScenarioKey } from "@/lib/sensitivity";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useLoadSavedAnalysis } from "@/lib/useLoadSavedAnalysis";

interface AnalyzeResponse {
  inputs: CommercialInputs;
  result: CommercialResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
  error?: string;
}

function TenantRow({
  tenant,
  onChange,
  onRemove,
}: {
  tenant: CommercialTenant;
  onChange: (t: CommercialTenant) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-1.5 rounded-lg border border-slate-200 p-2">
      <input
        type="text"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        value={tenant.name}
        onChange={(e) => onChange({ ...tenant, name: e.target.value })}
      />
      <input
        type="number"
        className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none tabular-nums"
        value={tenant.sqftLeased}
        onChange={(e) => onChange({ ...tenant, sqftLeased: e.target.valueAsNumber || 0 })}
        title="Sq ft leased"
      />
      <input
        type="number"
        className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none tabular-nums"
        value={tenant.annualRentPerSqft}
        onChange={(e) => onChange({ ...tenant, annualRentPerSqft: e.target.valueAsNumber || 0 })}
        title="$/sqft/yr"
      />
      <input
        type="number"
        className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none tabular-nums"
        value={tenant.leaseYearsRemaining}
        onChange={(e) => onChange({ ...tenant, leaseYearsRemaining: e.target.valueAsNumber || 0 })}
        title="Years left on lease"
      />
      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 text-sm px-1">
        ✕
      </button>
    </div>
  );
}

export function CommercialTab({
  loadAnalysisId,
  loadNonce,
}: {
  loadAnalysisId?: string;
  loadNonce?: number;
}) {
  const [inputs, setInputs] = useState<CommercialInputs>(DEFAULT_COMMERCIAL_INPUTS);
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
    return runScenarioCommercial(data.inputs, scenario);
  }, [data, scenario]);

  const set = <K extends keyof CommercialInputs>(key: K, value: CommercialInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  function updateTenant(index: number, t: CommercialTenant) {
    const tenants = [...inputs.tenants];
    tenants[index] = t;
    set("tenants", tenants);
  }

  function addTenant() {
    set("tenants", [
      ...inputs.tenants,
      { name: `Tenant ${inputs.tenants.length + 1}`, sqftLeased: 1000, annualRentPerSqft: 16, leaseYearsRemaining: 3 },
    ]);
  }

  function removeTenant(index: number) {
    set("tenants", inputs.tenants.filter((_, i) => i !== index));
  }

  function handleLeaseStructureChange(structure: LeaseStructure) {
    setInputs((prev) => ({
      ...prev,
      leaseStructure: structure,
      reimbursementPercent: DEFAULT_REIMBURSEMENT_PERCENT[structure],
    }));
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/commercial", {
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
        <h1 className="text-xl font-bold text-slate-900">Commercial Property Analyzer</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Lease-structure-aware underwriting: NNN/modified-gross/full-service
          reimbursements, tenant rent roll, weighted average lease term (WALT)
          rollover risk, and price/rent per square foot.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
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

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Purchase price" prefix="$" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} step={5000} />
            <NumberField label="Building sqft" value={inputs.buildingSqft} onChange={(v) => set("buildingSqft", v)} step={100} />
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Lease structure</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              value={inputs.leaseStructure}
              onChange={(e) => handleLeaseStructureChange(e.target.value as LeaseStructure)}
            >
              {Object.entries(LEASE_STRUCTURE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Tenant reimbursement of tax/insurance/CAM"
            suffix="%"
            value={inputs.reimbursementPercent}
            onChange={(v) => set("reimbursementPercent", v)}
            step={5}
            info={FIELD_HELP.reimbursementPercent}
          />

          <SectionHeading>Tenant rent roll</SectionHeading>
          <div className="overflow-x-auto">
          <div className="min-w-[400px]">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-1.5 text-[10px] text-slate-400 px-2">
            <span>Tenant</span>
            <span className="w-20">Sqft</span>
            <span className="w-20">$/sqft/yr</span>
            <span className="w-16">Yrs left</span>
            <span />
          </div>
          <div className="space-y-2">
            {inputs.tenants.map((t, i) => (
              <TenantRow key={i} tenant={t} onChange={(nt) => updateTenant(i, nt)} onRemove={() => removeTenant(i)} />
            ))}
          </div>
          </div>
          </div>
          <button type="button" onClick={addTenant} className="text-xs font-medium text-slate-600 hover:text-slate-900">
            + Add tenant
          </button>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Vacant sqft" value={inputs.vacantSqft} onChange={(v) => set("vacantSqft", v)} step={100} />
            <NumberField label="Market rent (vacant space)" prefix="$" suffix="/sqft/yr" value={inputs.marketRentPerSqftAnnual} onChange={(v) => set("marketRentPerSqftAnnual", v)} step={0.5} />
          </div>
          <NumberField label="Other monthly income" prefix="$" value={inputs.otherMonthlyIncome} onChange={(v) => set("otherMonthlyIncome", v)} step={25} help="Signage, parking, percentage rent" info={FIELD_HELP.otherMonthlyIncome} />

          <SectionHeading>Financing (commercial)</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Down payment" suffix="%" value={inputs.downPaymentPercent} onChange={(v) => set("downPaymentPercent", v)} step={1} info={FIELD_HELP.downPayment} />
            <NumberField label="Interest rate" suffix="%" value={inputs.interestRatePercent} onChange={(v) => set("interestRatePercent", v)} step={0.125} info={FIELD_HELP.interestRate} />
            <NumberField label="Amortization" suffix="yrs" value={inputs.amortizationYears} onChange={(v) => set("amortizationYears", v)} step={1} info={FIELD_HELP.amortizationYears} />
            <NumberField label="Loan term" suffix="yrs" value={inputs.loanTermYears} onChange={(v) => set("loanTermYears", v)} step={1} info={FIELD_HELP.loanTermCommercial} />
            <NumberField label="Closing costs" suffix="%" value={inputs.closingCostPercent} onChange={(v) => set("closingCostPercent", v)} step={0.5} info={FIELD_HELP.closingCosts} />
            <NumberField label="Rehab / TI budget" prefix="$" value={inputs.rehabCost} onChange={(v) => set("rehabCost", v)} step={1000} info={FIELD_HELP.rehabCost} />
          </div>

          <SectionHeading>Landlord operating costs</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Property tax" prefix="$" suffix="/yr" value={inputs.propertyTaxAnnual} onChange={(v) => set("propertyTaxAnnual", v)} step={500} info={FIELD_HELP.propertyTax} />
            <NumberField label="Insurance" prefix="$" suffix="/yr" value={inputs.insuranceAnnual} onChange={(v) => set("insuranceAnnual", v)} step={500} info={FIELD_HELP.insurance} />
            <NumberField label="CAM" prefix="$" suffix="/yr" value={inputs.camAnnual} onChange={(v) => set("camAnnual", v)} step={500} info={FIELD_HELP.camCost} />
            <NumberField label="Management" suffix="% of EGI" value={inputs.managementPercent} onChange={(v) => set("managementPercent", v)} step={0.5} info={FIELD_HELP.managementPercent} />
            <NumberField label="Credit loss" suffix="% of rent" value={inputs.creditLossPercent} onChange={(v) => set("creditLossPercent", v)} step={0.5} info={FIELD_HELP.creditLoss} />
          </div>

          <SectionHeading>Valuation &amp; exit</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Exit cap rate" suffix="%" value={inputs.exitCapRatePercent} onChange={(v) => set("exitCapRatePercent", v)} step={0.1} info={FIELD_HELP.exitCapRate} />
            <NumberField label="Rent growth" suffix="%/yr" value={inputs.annualRentGrowthPercent} onChange={(v) => set("annualRentGrowthPercent", v)} step={0.5} help="Contractual escalations" info={FIELD_HELP.rentGrowth} />
            <NumberField label="Expense growth" suffix="%/yr" value={inputs.annualExpenseGrowthPercent} onChange={(v) => set("annualExpenseGrowthPercent", v)} step={0.5} info={FIELD_HELP.expenseGrowth} />
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
              Fill in the tenant rent roll and financing details, then analyze.
            </div>
          )}
          {data && displayResult && displayVerdict && (
            <>
              <AnalysisToolbar
                propertyType="commercial"
                address={data.inputs.address}
                inputs={data.inputs}
                result={data.result}
                verdict={data.verdict}
              />
              <div className="mb-4">
                <ScenarioToggle value={scenario} onChange={setScenario} />
              </div>
              <CommercialResults result={displayResult} verdict={displayVerdict} />
              <PrintableReport
                title={
                  scenario === "base"
                    ? "Commercial Property Investment Analysis"
                    : `Commercial Property Investment Analysis — ${SCENARIO_LABELS[scenario]} scenario`
                }
                address={data.inputs.address}
                verdict={displayVerdict}
                metrics={[
                  { label: "Monthly cash flow", value: formatCurrency(displayResult.monthlyCashFlow) },
                  { label: "Cash-on-cash return", value: formatPercent(displayResult.cashOnCashReturnPercent) },
                  { label: "Cap rate (going-in)", value: formatPercent(displayResult.capRatePercent) },
                  { label: "DSCR", value: Number.isFinite(displayResult.dscr) ? displayResult.dscr.toFixed(2) : "∞" },
                  { label: "Price / sqft", value: formatCurrency(displayResult.pricePerSqft) },
                  { label: "WALT", value: `${displayResult.waltYears.toFixed(1)} yrs` },
                ]}
                tableTitle={`${displayResult.projection.length}-year projection`}
                tableHeaders={["Year", "Leased rent", "NOI", "Cash flow", "Property value", "Equity"]}
                tableRows={displayResult.projection.map((p) => [
                  String(p.year),
                  formatCurrency(p.leasedRent),
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

function CommercialResults({ result, verdict }: { result: CommercialResult; verdict: Verdict }) {
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
        <MetricCard label="Cash-on-cash return" value={formatPercent(result.cashOnCashReturnPercent)} tone={result.cashOnCashReturnPercent >= 8 ? "positive" : "negative"} info={RESULT_HELP.cashOnCash} />
        <MetricCard label="Cap rate (going-in)" value={formatPercent(result.capRatePercent)} info={RESULT_HELP.capRate} />
        <MetricCard label="DSCR" value={Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞"} tone={result.dscr >= 1.25 ? "positive" : "negative"} info={RESULT_HELP.dscr} />
        <MetricCard label="Price / sqft" value={formatCurrency(result.pricePerSqft)} info={RESULT_HELP.pricePerSqft} />
        <MetricCard label="Avg in-place rent / sqft" value={`${formatCurrency(result.avgInPlaceRentPerSqft, 2)}/yr`} />
        <MetricCard label="Occupancy" value={formatPercent(result.occupancyPercent)} tone={result.occupancyPercent >= 90 ? "positive" : "negative"} info={RESULT_HELP.commercialOccupancy} />
        <MetricCard label="WALT (lease term remaining)" value={`${result.waltYears.toFixed(1)} yrs`} tone={result.waltYears >= 3 ? "positive" : "negative"} info={RESULT_HELP.walt} />
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
                <th className="px-4 py-2">Leased rent</th>
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
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.leasedRent)}</td>
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
