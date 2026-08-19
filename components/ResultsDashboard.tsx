"use client";

import type { CalculationResult, Verdict } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { DUE_DILIGENCE_CHECKLIST, type StateFactor } from "@/lib/locationFactors";
import { RESULT_HELP } from "@/lib/fieldHelp";
import { MetricCard } from "./MetricCard";
import { VerdictBanner } from "./VerdictBanner";

interface ResultsDashboardProps {
  result: CalculationResult;
  verdict: Verdict;
  stateFactor: StateFactor | null;
}

const FRIENDLINESS_LABEL: Record<string, string> = {
  "landlord-friendly": "Landlord-friendly",
  balanced: "Balanced",
  "tenant-friendly": "Tenant-friendly",
};

export function ResultsDashboard({
  result,
  verdict,
  stateFactor,
}: ResultsDashboardProps) {
  return (
    <div className="space-y-6">
      <VerdictBanner verdict={verdict} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Monthly cash flow"
          value={formatCurrency(result.monthlyCashFlow)}
          tone={result.monthlyCashFlow >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Cash-on-cash return"
          value={formatPercent(result.cashOnCashReturnPercent)}
          tone={result.cashOnCashReturnPercent >= 8 ? "positive" : "negative"}
          info={RESULT_HELP.cashOnCash}
        />
        <MetricCard
          label="Cap rate"
          value={formatPercent(result.capRatePercent)}
          tone={result.capRatePercent >= 6 ? "positive" : "negative"}
          info={RESULT_HELP.capRate}
        />
        <MetricCard
          label="DSCR"
          value={Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞"}
          tone={result.dscr >= 1.25 ? "positive" : "negative"}
          help="Lenders typically want ≥ 1.25"
          info={RESULT_HELP.dscr}
        />
        <MetricCard
          label="Cash needed to close"
          value={formatCurrency(result.totalCashInvested)}
          help="Down payment + closing costs + points + rehab"
        />
        <MetricCard
          label="1% rule"
          value={formatPercent(result.onePercentRulePercent, 2)}
          tone={result.onePercentRulePercent >= 1 ? "positive" : "negative"}
          help="Monthly rent as % of price"
        />
        <MetricCard
          label="Gross rent multiplier"
          value={formatNumber(result.grossRentMultiplier, 1)}
          help="Lower is generally better"
          info={RESULT_HELP.grossRentMultiplier}
        />
        <MetricCard
          label="Break-even ratio"
          value={formatPercent(result.breakEvenRatioPercent)}
          tone={result.breakEvenRatioPercent <= 85 ? "positive" : "negative"}
          help="Expenses+debt as % of income"
          info={RESULT_HELP.breakEvenRatio}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h3 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
          Monthly cash flow breakdown
        </h3>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <table className="w-full text-sm">
            <tbody>
              <Row label="Gross rent" value={result.monthlyGrossRent} positive />
              <Row label="Vacancy loss" value={-result.monthlyVacancyLoss} />
              <Row label="Effective income" value={result.effectiveGrossMonthlyIncome} bold />
            </tbody>
          </table>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Property tax" value={-result.monthlyPropertyTax} />
              <Row label="Insurance" value={-result.monthlyInsurance} />
              <Row label="HOA" value={-result.monthlyHoa} />
              <Row label="Maintenance" value={-result.monthlyMaintenance} />
              <Row label="CapEx reserve" value={-result.monthlyCapEx} />
              <Row label="Management" value={-result.monthlyManagement} />
              <Row label="Utilities" value={-result.monthlyUtilities} />
              <Row label="Mortgage P&I" value={-result.monthlyPrincipalAndInterest} />
              {result.monthlyPmi > 0 && <Row label="PMI" value={-result.monthlyPmi} />}
              <Row label="Net cash flow" value={result.monthlyCashFlow} bold />
            </tbody>
          </table>
        </div>
      </div>

      {result.monthlyPmi > 0 && (
        <p className="text-xs text-slate-500">
          {result.pmiDropsAfterYear !== null
            ? `PMI (${formatCurrency(result.monthlyPmi)}/mo) is included above and stops automatically after year ${result.pmiDropsAfterYear}, once your loan balance reaches 80% of the original purchase price.`
            : `PMI (${formatCurrency(result.monthlyPmi)}/mo) is included above and doesn't fall to 80% loan-to-value within your ${result.projection.length}-year hold period at this pace of paydown.`}
        </p>
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
                <th className="px-4 py-2">Gross rent</th>
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
                  <td className={`px-4 py-2 tabular-nums ${p.cashFlow >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {formatCurrency(p.cashFlow)}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.propertyValue)}</td>
                  <td className="px-4 py-2 tabular-nums">{formatCurrency(p.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <MetricCard
            label="Net sale proceeds"
            value={formatCurrency(result.netSaleProceedsAtExit)}
            help="After payoff & selling costs"
            info={RESULT_HELP.netSaleProceeds}
          />
          <MetricCard
            label="Total profit at exit"
            value={formatCurrency(result.totalReturnAtExit)}
            tone={result.totalReturnAtExit >= 0 ? "positive" : "negative"}
          />
          <MetricCard
            label="Equity multiple"
            value={`${formatNumber(result.equityMultiple, 2)}x`}
            help="Total returned / cash invested"
            info={RESULT_HELP.equityMultiple}
          />
          <MetricCard
            label="IRR"
            value={result.irrPercent !== null ? formatPercent(result.irrPercent) : "—"}
            tone={
              result.irrPercent !== null
                ? result.irrPercent >= 12
                  ? "positive"
                  : "negative"
                : "neutral"
            }
            info={RESULT_HELP.irr}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Location &amp; regulatory factors
        </h3>
        {stateFactor ? (
          <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
            <span className="font-medium">{stateFactor.state}:</span>{" "}
            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-700 mr-2">
              {FRIENDLINESS_LABEL[stateFactor.friendliness]}
            </span>
            <span className="text-slate-600">{stateFactor.notes}</span>
          </div>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            Include a state in the address (e.g. "Austin, TX") to see landlord/tenant
            regulatory climate for that state.
          </p>
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Due diligence checklist — beyond the spreadsheet
        </h4>
        <ul className="space-y-2">
          {DUE_DILIGENCE_CHECKLIST.map((item) => (
            <li key={item.question} className="text-sm">
              <span className="inline-block rounded bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 mr-2">
                {item.category}
              </span>
              <span className="font-medium text-slate-800">{item.question}</span>
              <span className="block text-xs text-slate-500 ml-0">{item.why}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  positive,
}: {
  label: string;
  value: number;
  bold?: boolean;
  positive?: boolean;
}) {
  const color = positive
    ? "text-slate-900"
    : value < 0
    ? "text-slate-600"
    : "text-emerald-700";
  return (
    <tr className={`border-b border-slate-100 last:border-0 ${bold ? "bg-slate-50" : ""}`}>
      <td className={`px-4 py-2 ${bold ? "font-semibold" : ""} text-slate-700`}>{label}</td>
      <td className={`px-4 py-2 text-right tabular-nums ${bold ? "font-semibold" : color}`}>
        {formatCurrency(value)}
      </td>
    </tr>
  );
}
