"use client";

import { useState } from "react";
import { calculateRefi, DEFAULT_REFI_INPUTS, type RefiInputs } from "@/lib/refi";
import { NumberField } from "./FieldGroup";
import { MetricCard } from "./MetricCard";
import { FIELD_HELP, RESULT_HELP } from "@/lib/fieldHelp";
import { formatCurrency, formatPercent } from "@/lib/format";

export function RefiCalculator({
  originalLoanAmount,
  totalCashInvested,
  monthlyNoi,
  purchasePrice,
  rehabCost,
}: {
  originalLoanAmount: number;
  totalCashInvested: number;
  monthlyNoi: number;
  purchasePrice: number;
  rehabCost: number;
}) {
  const [open, setOpen] = useState(false);
  const [refi, setRefi] = useState<RefiInputs>({
    afterRepairValue: purchasePrice + rehabCost,
    ...DEFAULT_REFI_INPUTS,
  });

  const set = <K extends keyof RefiInputs>(key: K, value: RefiInputs[K]) =>
    setRefi((prev) => ({ ...prev, [key]: value }));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
      >
        + Model a BRRRR / cash-out refinance
      </button>
    );
  }

  const result = calculateRefi(originalLoanAmount, totalCashInvested, monthlyNoi, refi);

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-indigo-900">BRRRR / Cash-Out Refinance</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Hide
        </button>
      </div>
      <p className="mt-1 max-w-2xl text-xs text-indigo-900/70">
        A before/after snapshot, not a month-by-month timeline — assumes the refinance happens
        shortly after rehab, before meaningful loan paydown, and doesn&apos;t account for lender
        seasoning requirements (many require 6–12 months of ownership before a cash-out refi).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberField
          label="After-repair value"
          prefix="$"
          value={refi.afterRepairValue}
          onChange={(v) => set("afterRepairValue", v)}
          step={1000}
          info={FIELD_HELP.afterRepairValue}
        />
        <NumberField
          label="Refinance LTV"
          suffix="%"
          value={refi.refinanceLtvPercent}
          onChange={(v) => set("refinanceLtvPercent", v)}
          step={1}
          info={FIELD_HELP.refinanceLtv}
        />
        <NumberField
          label="New interest rate"
          suffix="%"
          value={refi.newInterestRatePercent}
          onChange={(v) => set("newInterestRatePercent", v)}
          step={0.125}
          info={FIELD_HELP.refiRate}
        />
        <NumberField
          label="New loan term"
          suffix="yrs"
          value={refi.newLoanTermYears}
          onChange={(v) => set("newLoanTermYears", v)}
          step={1}
        />
        <NumberField
          label="Refinance closing costs"
          suffix="%"
          value={refi.refinanceClosingCostPercent}
          onChange={(v) => set("refinanceClosingCostPercent", v)}
          step={0.5}
          info={FIELD_HELP.refiClosingCosts}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Cash pulled out"
          value={formatCurrency(result.cashPulledOut)}
          tone={result.cashPulledOut >= 0 ? "positive" : "negative"}
          info={RESULT_HELP.cashPulledOut}
        />
        <MetricCard
          label="Cash left in deal"
          value={formatCurrency(result.cashLeftInDeal)}
          tone={result.cashLeftInDeal <= 0 ? "positive" : "neutral"}
          info={RESULT_HELP.cashLeftInDeal}
        />
        <MetricCard label="New loan amount" value={formatCurrency(result.newLoanAmount)} />
        <MetricCard
          label="New monthly P&I"
          value={formatCurrency(result.newMonthlyPrincipalAndInterest)}
        />
        <MetricCard
          label="Post-refi cash flow"
          value={formatCurrency(result.postRefiMonthlyCashFlow)}
          tone={result.postRefiMonthlyCashFlow >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Post-refi cash-on-cash"
          value={
            result.postRefiCashOnCashReturnPercent !== null
              ? formatPercent(result.postRefiCashOnCashReturnPercent)
              : "∞"
          }
          help={result.postRefiCashOnCashReturnPercent === null ? "No cash left in the deal" : undefined}
          info={RESULT_HELP.postRefiCashOnCash}
        />
        <MetricCard
          label="Post-refi DSCR"
          value={Number.isFinite(result.postRefiDscr) ? result.postRefiDscr.toFixed(2) : "∞"}
          tone={result.postRefiDscr >= 1.25 ? "positive" : "negative"}
          info={RESULT_HELP.postRefiDscr}
        />
      </div>
    </div>
  );
}
