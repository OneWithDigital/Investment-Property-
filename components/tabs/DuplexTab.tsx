"use client";

import { useState } from "react";
import {
  DEFAULT_DUPLEX_INPUTS,
  type DuplexInputs,
  type DuplexResult,
  type RentalUnit,
} from "@/lib/calc/duplex";
import type { Verdict } from "@/lib/types";
import type { StateFactor } from "@/lib/locationFactors";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { MetricCard } from "@/components/MetricCard";
import { VerdictBanner } from "@/components/VerdictBanner";
import { MlsLookupButton } from "@/components/MlsLookupButton";
import { formatCurrency, formatPercent } from "@/lib/format";

interface AnalyzeResponse {
  inputs: DuplexInputs;
  result: DuplexResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
  error?: string;
}

function UnitRow({
  unit,
  onChange,
  onRemove,
  removable,
}: {
  unit: RentalUnit;
  onChange: (unit: RentalUnit) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
      <input
        type="text"
        className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        value={unit.label}
        onChange={(e) => onChange({ ...unit, label: e.target.value })}
      />
      <div className="flex items-center rounded border border-slate-300 flex-1">
        <span className="pl-2 text-slate-400 text-sm">$</span>
        <input
          type="number"
          className="w-full px-2 py-1.5 text-sm outline-none tabular-nums"
          value={unit.monthlyRent}
          onChange={(e) => onChange({ ...unit, monthlyRent: e.target.valueAsNumber || 0 })}
        />
        <span className="pr-2 text-slate-400 text-xs">/mo</span>
      </div>
      <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
        <input
          type="checkbox"
          checked={unit.ownerOccupied}
          onChange={(e) => onChange({ ...unit, ownerOccupied: e.target.checked })}
        />
        You live here
      </label>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 text-sm px-1"
          aria-label="Remove unit"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function DuplexTab() {
  const [inputs, setInputs] = useState<DuplexInputs>(DEFAULT_DUPLEX_INPUTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const set = <K extends keyof DuplexInputs>(key: K, value: DuplexInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  function updateUnit(index: number, unit: RentalUnit) {
    const units = [...inputs.units];
    units[index] = unit;
    set("units", units);
  }

  function addUnit() {
    set("units", [
      ...inputs.units,
      { label: `Unit ${String.fromCharCode(65 + inputs.units.length)}`, monthlyRent: 1500, ownerOccupied: false },
    ]);
  }

  function removeUnit(index: number) {
    set("units", inputs.units.filter((_, i) => i !== index));
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/duplex", {
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
        <h1 className="text-xl font-bold text-slate-900">Duplex / Small Multifamily (2-4 Units)</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Per-unit rent roll with house-hacking support: live in one unit with
          low-down-payment owner-occupant financing while tenants cover some or
          all of your housing cost.
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
            }}
          />

          <div>
            <span className="text-sm font-medium text-slate-700">Financing approach</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set("financingType", "house-hack")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  inputs.financingType === "house-hack"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                House-hack (live-in)
              </button>
              <button
                type="button"
                onClick={() => set("financingType", "investor")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  inputs.financingType === "investor"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Pure investor
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {inputs.financingType === "house-hack"
                ? "Owner-occupants of 2-4 unit properties can often get FHA/conventional financing as low as 3.5-5% down."
                : "Non-owner-occupied investment purchases typically require 20-25% down."}
            </p>
          </div>

          <SectionHeading>Units</SectionHeading>
          <div className="space-y-2">
            {inputs.units.map((unit, i) => (
              <UnitRow
                key={i}
                unit={unit}
                onChange={(u) => updateUnit(i, u)}
                onRemove={() => removeUnit(i)}
                removable={inputs.units.length > 1}
              />
            ))}
            <button
              type="button"
              onClick={addUnit}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              + Add unit
            </button>
          </div>

          {inputs.financingType === "house-hack" && (
            <NumberField
              label="Comparable market rent for your unit"
              prefix="$"
              suffix="/mo"
              value={inputs.comparableMarketRentForYourUnit}
              onChange={(v) => set("comparableMarketRentForYourUnit", v)}
              step={25}
              help="What you'd pay to rent a similar unit elsewhere"
            />
          )}

          <SectionHeading>Purchase &amp; financing</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Purchase price" prefix="$" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} step={1000} />
            <NumberField label="Down payment" suffix="%" value={inputs.downPaymentPercent} onChange={(v) => set("downPaymentPercent", v)} step={0.5} />
            <NumberField label="Interest rate" suffix="%" value={inputs.interestRatePercent} onChange={(v) => set("interestRatePercent", v)} step={0.125} />
            <NumberField label="Loan term" suffix="yrs" value={inputs.loanTermYears} onChange={(v) => set("loanTermYears", v)} step={1} />
            <NumberField label="Closing costs" suffix="%" value={inputs.closingCostPercent} onChange={(v) => set("closingCostPercent", v)} step={0.5} />
            <NumberField label="Rehab budget" prefix="$" value={inputs.rehabCost} onChange={(v) => set("rehabCost", v)} step={500} />
          </div>

          <SectionHeading>Expenses</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Property tax" prefix="$" suffix="/yr" value={inputs.propertyTaxAnnual} onChange={(v) => set("propertyTaxAnnual", v)} step={100} />
            <NumberField label="Insurance" prefix="$" suffix="/yr" value={inputs.insuranceAnnual} onChange={(v) => set("insuranceAnnual", v)} step={50} />
            <NumberField label="HOA" prefix="$" suffix="/mo" value={inputs.hoaMonthly} onChange={(v) => set("hoaMonthly", v)} step={10} />
            <NumberField label="Owner-paid utilities" prefix="$" suffix="/mo" value={inputs.utilitiesMonthlyOwnerPaid} onChange={(v) => set("utilitiesMonthlyOwnerPaid", v)} step={10} />
            <NumberField label="Maintenance" suffix="% of rent" value={inputs.maintenancePercent} onChange={(v) => set("maintenancePercent", v)} step={0.5} />
            <NumberField label="CapEx reserve" suffix="% of rent" value={inputs.capExPercent} onChange={(v) => set("capExPercent", v)} step={0.5} />
            <NumberField label="Vacancy" suffix="% of rent" value={inputs.vacancyPercent} onChange={(v) => set("vacancyPercent", v)} step={0.5} />
            <NumberField label="Management" suffix="% of rent" value={inputs.managementPercent} onChange={(v) => set("managementPercent", v)} step={0.5} />
          </div>

          <SectionHeading>Growth &amp; exit</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Rent growth" suffix="%/yr" value={inputs.annualRentGrowthPercent} onChange={(v) => set("annualRentGrowthPercent", v)} step={0.5} />
            <NumberField label="Expense growth" suffix="%/yr" value={inputs.annualExpenseGrowthPercent} onChange={(v) => set("annualExpenseGrowthPercent", v)} step={0.5} />
            <NumberField label="Appreciation" suffix="%/yr" value={inputs.annualAppreciationPercent} onChange={(v) => set("annualAppreciationPercent", v)} step={0.5} />
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
          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
              {error}
            </div>
          )}
          {!data && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-400">
              Fill in the units and financing details, then analyze.
            </div>
          )}
          {data && <DuplexResults result={data.result} verdict={data.verdict} inputs={data.inputs} />}
        </div>
      </div>
    </div>
  );
}

function DuplexResults({
  result,
  verdict,
  inputs,
}: {
  result: DuplexResult;
  verdict: Verdict;
  inputs: DuplexInputs;
}) {
  return (
    <div className="space-y-6">
      <VerdictBanner verdict={verdict} />

      {result.isHouseHacking && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <h3 className="text-sm font-semibold text-indigo-900">House-hack snapshot</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Your effective housing cost"
              value={formatCurrency(result.effectiveMonthlyHousingCost)}
              tone={result.effectiveMonthlyHousingCost <= 0 ? "positive" : "neutral"}
              help="What you pay monthly to live there, after tenant rent"
            />
            {inputs.comparableMarketRentForYourUnit > 0 && (
              <MetricCard
                label="Savings vs. renting nearby"
                value={formatCurrency(result.housingSavingsVsRentingMonthly)}
                tone={result.housingSavingsVsRentingMonthly > 0 ? "positive" : "negative"}
              />
            )}
            <MetricCard
              label="If fully rented (you move out)"
              value={formatCurrency(result.fullyRentedMonthlyCashFlow)}
              help="Cash flow once every unit is tenant-occupied"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Monthly cash flow" value={formatCurrency(result.monthlyCashFlow)} tone={result.monthlyCashFlow >= 0 ? "positive" : "negative"} />
        <MetricCard label="Cash-on-cash return" value={formatPercent(result.cashOnCashReturnPercent)} tone={result.cashOnCashReturnPercent >= 8 ? "positive" : "negative"} />
        <MetricCard label="Cap rate" value={formatPercent(result.capRatePercent)} tone={result.capRatePercent >= 6 ? "positive" : "negative"} />
        <MetricCard label="DSCR" value={Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞"} tone={result.dscr >= 1.25 ? "positive" : "negative"} />
        <MetricCard label="Cash needed to close" value={formatCurrency(result.totalCashInvested)} />
        <MetricCard label="1% rule (full market rent)" value={formatPercent(result.onePercentRulePercent, 2)} tone={result.onePercentRulePercent >= 1 ? "positive" : "negative"} />
        <MetricCard label="Price per unit" value={formatCurrency(result.pricePerUnit)} />
        <MetricCard label="Break-even ratio" value={formatPercent(result.breakEvenRatioPercent)} tone={result.breakEvenRatioPercent <= 85 ? "positive" : "negative"} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h3 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
          {result.projection.length}-year projection &amp; exit
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">Rent collected</th>
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
          <MetricCard label="Net sale proceeds" value={formatCurrency(result.netSaleProceedsAtExit)} />
          <MetricCard label="Total profit at exit" value={formatCurrency(result.totalReturnAtExit)} tone={result.totalReturnAtExit >= 0 ? "positive" : "negative"} />
          <MetricCard label="Equity multiple" value={`${result.equityMultiple.toFixed(2)}x`} />
          <MetricCard label="IRR" value={result.irrPercent !== null ? formatPercent(result.irrPercent) : "—"} tone={result.irrPercent !== null ? (result.irrPercent >= 12 ? "positive" : "negative") : "neutral"} />
        </div>
      </div>
    </div>
  );
}
