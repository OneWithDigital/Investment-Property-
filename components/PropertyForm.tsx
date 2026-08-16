"use client";

import { useState } from "react";
import type { PropertyInputs, ZillowLookupResult } from "@/lib/types";
import type { MlsLookupResult } from "@/lib/mlsLookup";
import { NumberField, SectionHeading } from "./FieldGroup";
import { MlsLookupButton } from "./MlsLookupButton";

interface PropertyFormProps {
  inputs: PropertyInputs;
  onChange: (inputs: PropertyInputs) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function PropertyForm({
  inputs,
  onChange,
  onSubmit,
  loading,
}: PropertyFormProps) {
  const [lookupValue, setLookupValue] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<ZillowLookupResult | null>(
    null
  );

  const set = <K extends keyof PropertyInputs>(key: K, value: PropertyInputs[K]) =>
    onChange({ ...inputs, [key]: value });

  async function handleLookup() {
    if (!lookupValue.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const isUrl = /^https?:\/\//i.test(lookupValue.trim());
      if (isUrl) {
        const res = await fetch("/api/zillow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: lookupValue.trim() }),
        });
        const data: ZillowLookupResult = await res.json();
        setLookupResult(data);
        const next: PropertyInputs = { ...inputs };
        if (data.address) next.address = data.address;
        if (data.price) next.purchasePrice = data.price;
        if (data.rentZestimate) next.monthlyRent = data.rentZestimate;
        if (data.propertyTaxAnnual) next.propertyTaxAnnual = data.propertyTaxAnnual;
        onChange(next);
      } else {
        onChange({ ...inputs, address: lookupValue.trim() });
        setLookupResult(null);
      }
    } catch {
      setLookupResult({
        address: null,
        zpid: null,
        price: null,
        bedrooms: null,
        bathrooms: null,
        livingAreaSqft: null,
        propertyTaxAnnual: null,
        hoaMonthly: null,
        rentZestimate: null,
        zestimate: null,
        yearBuilt: null,
        homeType: null,
        fetched: false,
        fetchError: "Something went wrong reaching the lookup service.",
      });
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            Zillow URL or address
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 text-slate-900"
              placeholder="https://www.zillow.com/homedetails/... or 123 Main St, Austin, TX"
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLookup();
                }
              }}
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupLoading}
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {lookupLoading ? "Looking up…" : "Look up"}
            </button>
          </div>
        </label>
        {lookupResult?.fetchError && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {lookupResult.fetchError} Zillow blocks most automated requests, so
            price/rent/tax fields below may need to be filled in by hand from
            the listing — that's expected, not an error in the tool.
          </p>
        )}
        <MlsLookupButton
          address={inputs.address || lookupValue}
          onApply={(data: MlsLookupResult) => {
            const next: PropertyInputs = { ...inputs };
            if (data.estimatedValue) next.purchasePrice = data.estimatedValue;
            if (data.estimatedRent) next.monthlyRent = data.estimatedRent;
            onChange(next);
          }}
        />
        {lookupResult?.fetched && (
          <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            Pulled what Zillow exposed publicly for this listing. Double-check
            price, tax, and rent estimate against the live listing before
            trusting the analysis.
          </p>
        )}
      </div>

      {inputs.address && (
        <div className="text-sm text-slate-500">
          Analyzing: <span className="font-medium text-slate-700">{inputs.address}</span>
        </div>
      )}

      <SectionHeading>Purchase &amp; financing</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Purchase price" prefix="$" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} step={1000} />
        <NumberField label="Down payment" suffix="%" value={inputs.downPaymentPercent} onChange={(v) => set("downPaymentPercent", v)} step={1} />
        <NumberField label="Interest rate" suffix="%" value={inputs.interestRatePercent} onChange={(v) => set("interestRatePercent", v)} step={0.125} />
        <NumberField label="Loan term" suffix="yrs" value={inputs.loanTermYears} onChange={(v) => set("loanTermYears", v)} step={1} />
        <NumberField label="Closing costs" suffix="%" value={inputs.closingCostPercent} onChange={(v) => set("closingCostPercent", v)} step={0.5} />
        <NumberField label="Rehab / repair budget" prefix="$" value={inputs.rehabCost} onChange={(v) => set("rehabCost", v)} step={500} />
      </div>

      <SectionHeading>Income</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Monthly rent" prefix="$" value={inputs.monthlyRent} onChange={(v) => set("monthlyRent", v)} step={25} />
        <NumberField label="Other monthly income" prefix="$" value={inputs.otherMonthlyIncome} onChange={(v) => set("otherMonthlyIncome", v)} step={25} help="Laundry, parking, storage, etc." />
      </div>

      <SectionHeading>Operating expenses</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Property tax" prefix="$" suffix="/yr" value={inputs.propertyTaxAnnual} onChange={(v) => set("propertyTaxAnnual", v)} step={100} />
        <NumberField label="Insurance" prefix="$" suffix="/yr" value={inputs.insuranceAnnual} onChange={(v) => set("insuranceAnnual", v)} step={50} />
        <NumberField label="HOA" prefix="$" suffix="/mo" value={inputs.hoaMonthly} onChange={(v) => set("hoaMonthly", v)} step={10} />
        <NumberField label="Owner-paid utilities" prefix="$" suffix="/mo" value={inputs.utilitiesMonthlyOwnerPaid} onChange={(v) => set("utilitiesMonthlyOwnerPaid", v)} step={10} />
        <NumberField label="Maintenance reserve" suffix="% of rent" value={inputs.maintenancePercent} onChange={(v) => set("maintenancePercent", v)} step={0.5} />
        <NumberField label="CapEx reserve" suffix="% of rent" value={inputs.capExPercent} onChange={(v) => set("capExPercent", v)} step={0.5} />
        <NumberField label="Vacancy" suffix="% of rent" value={inputs.vacancyPercent} onChange={(v) => set("vacancyPercent", v)} step={0.5} />
        <NumberField label="Property management" suffix="% of rent" value={inputs.managementPercent} onChange={(v) => set("managementPercent", v)} step={0.5} help="Set to 0 if self-managing" />
      </div>

      <SectionHeading>Growth &amp; exit assumptions</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Rent growth" suffix="%/yr" value={inputs.annualRentGrowthPercent} onChange={(v) => set("annualRentGrowthPercent", v)} step={0.5} />
        <NumberField label="Expense growth" suffix="%/yr" value={inputs.annualExpenseGrowthPercent} onChange={(v) => set("annualExpenseGrowthPercent", v)} step={0.5} />
        <NumberField label="Appreciation" suffix="%/yr" value={inputs.annualAppreciationPercent} onChange={(v) => set("annualAppreciationPercent", v)} step={0.5} />
        <NumberField label="Selling costs" suffix="% of price" value={inputs.sellingCostPercent} onChange={(v) => set("sellingCostPercent", v)} step={0.5} />
        <NumberField label="Hold period" suffix="yrs" value={inputs.holdPeriodYears} onChange={(v) => set("holdPeriodYears", v)} step={1} />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 mt-2"
      >
        {loading ? "Analyzing…" : "Analyze property"}
      </button>
    </div>
  );
}
