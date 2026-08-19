"use client";

import { useMemo, useState } from "react";
import {
  simulateHelocPaydown,
  DEFAULT_HELOC_INPUTS,
  type HelocPaydownInputs,
  type HelocPaydownResult,
  type StrategyResult,
} from "@/lib/calc/helocPaydown";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency } from "@/lib/format";

function formatMonths(months: number | null): string {
  if (months === null) return "50+ yrs";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}

export function HelocPayoffTab() {
  const [inputs, setInputs] = useState<HelocPaydownInputs>(DEFAULT_HELOC_INPUTS);
  const [result, setResult] = useState<HelocPaydownResult | null>(
    simulateHelocPaydown(DEFAULT_HELOC_INPUTS)
  );

  const set = <K extends keyof HelocPaydownInputs>(key: K, value: HelocPaydownInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  function handleCalculate() {
    setResult(simulateHelocPaydown(inputs));
  }

  const helocRateHigherThanMortgage = inputs.helocRatePercent > inputs.mortgageRatePercent;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">HELOC Mortgage Payoff (Velocity Banking)</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Simulates the &quot;chunking&quot; strategy — draw a lump sum against a HELOC,
          apply it to mortgage principal, then flush your monthly cash flow through
          the HELOC before drawing the next chunk — side by side with simply making
          minimum payments or applying that same cash flow directly to the mortgage
          as extra principal.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20 space-y-4">
          <SectionHeading>Your mortgage</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Current balance"
              prefix="$"
              value={inputs.mortgageBalance}
              onChange={(v) => set("mortgageBalance", v)}
              step={1000}
            />
            <NumberField
              label="Interest rate"
              suffix="%"
              value={inputs.mortgageRatePercent}
              onChange={(v) => set("mortgageRatePercent", v)}
              step={0.125}
            />
            <NumberField
              label="Years remaining"
              suffix="yrs"
              value={inputs.mortgageRemainingTermYears}
              onChange={(v) => set("mortgageRemainingTermYears", v)}
              step={1}
              help="Used to derive your current P&I payment"
            />
          </div>

          <SectionHeading>Your HELOC</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Credit limit"
              prefix="$"
              value={inputs.helocLimit}
              onChange={(v) => set("helocLimit", v)}
              step={1000}
            />
            <NumberField
              label="Interest rate"
              suffix="%"
              value={inputs.helocRatePercent}
              onChange={(v) => set("helocRatePercent", v)}
              step={0.125}
              help="Usually variable — check the current rate"
            />
            <NumberField
              label="Chunk size"
              suffix="% of limit"
              value={inputs.chunkPercentOfLimit}
              onChange={(v) => set("chunkPercentOfLimit", v)}
              step={5}
              help="Draw per chunk, leaving a safety margin"
            />
          </div>

          <SectionHeading>Cash flow</SectionHeading>
          <NumberField
            label="Monthly discretionary cash flow"
            prefix="$"
            value={inputs.monthlyDiscretionaryIncome}
            onChange={(v) => set("monthlyDiscretionaryIncome", v)}
            step={50}
            help="What's left over each month after the mortgage payment and all living expenses — the fuel for either strategy"
          />

          {helocRateHigherThanMortgage && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Your HELOC rate is higher than your mortgage rate — every dollar
              that sits in a HELOC chunk (rather than going straight to
              principal) accrues interest at that higher rate the whole time
              it's outstanding.
            </p>
          )}

          <button
            type="button"
            onClick={handleCalculate}
            className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Calculate
          </button>
        </div>

        <div>{result && <HelocPayoffResults result={result} inputs={inputs} />}</div>
      </div>
    </div>
  );
}

function StrategyCard({
  title,
  description,
  strategy,
  totalDebt,
  highlight,
}: {
  title: string;
  description: string;
  strategy: StrategyResult;
  totalDebt: number;
  highlight?: "best" | "worst" | "neutral";
}) {
  const borderColor =
    highlight === "best"
      ? "border-emerald-300"
      : highlight === "worst"
      ? "border-rose-200"
      : "border-slate-200";
  const badgeColor =
    highlight === "best"
      ? "bg-emerald-100 text-emerald-800"
      : highlight === "worst"
      ? "bg-rose-100 text-rose-700"
      : "bg-slate-100 text-slate-600";

  return (
    <div className={`rounded-xl border ${borderColor} bg-white p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {highlight === "best" && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
            FASTEST
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Debt-free in</div>
          <div className="text-lg font-bold tabular-nums text-slate-900">
            {formatMonths(strategy.monthsToTotalFreedom)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Total interest</div>
          <div className="text-lg font-bold tabular-nums text-slate-900">
            {formatCurrency(strategy.totalInterestPaid)}
          </div>
        </div>
      </div>
      {strategy.chunkCount > 0 && (
        <div className="mt-2 text-xs text-slate-400">{strategy.chunkCount} HELOC chunks drawn</div>
      )}
      {strategy.hitSimulationCap && (
        <div className="mt-2 text-xs text-rose-600">
          Doesn&apos;t pay off {formatCurrency(totalDebt)} of debt within 50 years at this cash flow.
        </div>
      )}
    </div>
  );
}

function HelocPayoffResults({
  result,
  inputs,
}: {
  result: HelocPaydownResult;
  inputs: HelocPaydownInputs;
}) {
  const { minimumPayments, extraPrincipal, helocChunking } = result;

  const fastest = useMemo(() => {
    const candidates: Array<[string, number | null]> = [
      ["extra", extraPrincipal.monthsToTotalFreedom],
      ["heloc", helocChunking.monthsToTotalFreedom],
    ];
    const resolved = candidates.filter(
      (c): c is [string, number] => c[1] !== null
    );
    if (resolved.length === 0) return null;
    return resolved.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  }, [extraPrincipal.monthsToTotalFreedom, helocChunking.monthsToTotalFreedom]);

  const interestSavedVsMinimum =
    minimumPayments.totalInterestPaid - helocChunking.totalInterestPaid;
  const helocVsExtraDelta = extraPrincipal.totalInterestPaid - helocChunking.totalInterestPaid;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Current P&I payment" value={formatCurrency(result.monthlyPayment)} />
        <MetricCard
          label="Interest saved vs. doing nothing"
          value={formatCurrency(Math.max(interestSavedVsMinimum, 0))}
          tone={interestSavedVsMinimum > 0 ? "positive" : "neutral"}
          help="HELOC chunking vs. minimum payments only"
        />
        <MetricCard
          label="HELOC chunking vs. extra payments"
          value={`${helocVsExtraDelta >= 0 ? "+" : "-"}${formatCurrency(Math.abs(helocVsExtraDelta))}`}
          tone={helocVsExtraDelta > 0 ? "positive" : helocVsExtraDelta < 0 ? "negative" : "neutral"}
          help={helocVsExtraDelta >= 0 ? "HELOC saves this much more" : "HELOC costs this much more"}
        />
        <MetricCard
          label="Time saved vs. doing nothing"
          value={
            minimumPayments.monthsToMortgageFreedom && helocChunking.monthsToTotalFreedom
              ? formatMonths(
                  Math.max(
                    minimumPayments.monthsToMortgageFreedom - helocChunking.monthsToTotalFreedom,
                    0
                  )
                )
              : "—"
          }
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Three strategies for the same {formatCurrency(inputs.monthlyDiscretionaryIncome)}/month
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StrategyCard
            title="Minimum payments"
            description="Do nothing extra — pure amortization"
            strategy={minimumPayments}
            totalDebt={inputs.mortgageBalance}
            highlight="neutral"
          />
          <StrategyCard
            title="Extra principal payments"
            description="Send the cash flow straight to mortgage principal every month — no HELOC"
            strategy={extraPrincipal}
            totalDebt={inputs.mortgageBalance}
            highlight={fastest === "extra" ? "best" : "neutral"}
          />
          <StrategyCard
            title="HELOC chunking"
            description="Draw HELOC chunks against the mortgage, flush cash flow through the HELOC, repeat"
            strategy={helocChunking}
            totalDebt={inputs.mortgageBalance}
            highlight={fastest === "heloc" ? "best" : helocVsExtraDelta < 0 ? "worst" : "neutral"}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h3 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
          HELOC chunking — year-by-year balances
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">Mortgage balance</th>
                <th className="px-4 py-2">HELOC balance</th>
                <th className="px-4 py-2">Cumulative interest</th>
              </tr>
            </thead>
            <tbody>
              {helocChunking.yearly.map((snap) => (
                <tr key={snap.month} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium">
                    {Math.round(snap.month / 12)} {snap.month % 12 !== 0 ? `(mo ${snap.month})` : ""}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(snap.mortgageBalance)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(snap.helocBalance)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(snap.cumulativeInterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-3 text-sm text-indigo-900">
        <h3 className="font-semibold">How this actually works — and its real limitation</h3>
        <p>
          HELOC &quot;chunking&quot; (aka velocity banking) works by drawing a lump sum
          against a revolving line of credit and applying it as extra principal on
          the mortgage, then routing your income through the HELOC so it stops
          accruing interest on that portion the moment it lands, since HELOC interest
          compounds daily on the outstanding balance rather than following a fixed
          amortization schedule. Once the HELOC is flushed back to zero, you draw
          another chunk and repeat until the mortgage is gone.
        </p>
        <p>
          The side-by-side comparison above is the point of this tool: the speed-up
          comes almost entirely from consistently applying your monthly discretionary
          cash flow to debt — not from the HELOC mechanism itself. When the HELOC rate
          equals the mortgage rate, chunking lands within a rounding error of simply
          sending that same cash flow directly to mortgage principal every month. When
          the HELOC carries a higher rate (common, since HELOCs are usually variable
          and priced off prime), chunking can actually cost <em>more</em> in total
          interest than the plain extra-payment strategy, because every dollar parked
          in an unpaid chunk accrues at the higher rate the whole time it&apos;s
          outstanding.
        </p>
        <p>
          Where chunking can genuinely help is behavioral: routing income through a
          HELOC forces discipline (everything is debt until it's flushed) in a way a
          savings account doesn't. It also carries real risks a plain extra-payment
          strategy doesn't: your home secures the HELOC balance, HELOC rates are
          usually variable and can rise, most HELOCs have a draw period after which
          they convert to a fixed repayment schedule, and any dip below your monthly
          discretionary cash flow assumption (job loss, an unexpected expense) leaves
          you carrying revolving debt against your house instead of just a slower
          mortgage payoff.
        </p>
        <p className="text-xs text-indigo-700">
          Educational estimate only, not financial advice — confirm your actual P&amp;I
          payment, HELOC terms (draw period, repayment period, fees, rate caps), and
          realistic monthly cash flow with your lender before acting on this.
        </p>
      </div>
    </div>
  );
}
