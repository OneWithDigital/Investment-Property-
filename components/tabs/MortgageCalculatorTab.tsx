"use client";

import { useMemo, useState } from "react";
import {
  compareToBaseline,
  computeMortgage,
  getDefaultMortgageInputs,
  MONTH_NAMES,
  type MortgageInputs,
} from "@/lib/calc/mortgage";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency, formatPercent } from "@/lib/format";

type ScheduleView = "yearly" | "monthly";

function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function MortgageCalculatorTab() {
  const [inputs, setInputs] = useState<MortgageInputs>(getDefaultMortgageInputs());
  const [scheduleView, setScheduleView] = useState<ScheduleView>("yearly");

  const set = <K extends keyof MortgageInputs>(key: K, value: MortgageInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const summary = useMemo(() => computeMortgage(inputs), [inputs]);
  const hasExtraPayments =
    inputs.extraMonthlyPayment > 0 || inputs.extraOneTimePayment > 0 || inputs.biweekly;
  const impact = useMemo(
    () => (hasExtraPayments ? compareToBaseline(inputs) : null),
    [inputs, hasExtraPayments]
  );

  const downPaymentAmount = summary.downPaymentAmount;

  const breakdown = [
    { label: "Principal & Interest", value: summary.monthlyPI, color: "bg-slate-800" },
    { label: "Property Tax", value: summary.monthlyTax, color: "bg-sky-500" },
    { label: "Insurance", value: summary.monthlyInsurance, color: "bg-amber-500" },
    { label: "HOA", value: summary.monthlyHoa, color: "bg-violet-500" },
    { label: "PMI", value: summary.monthlyPmi, color: "bg-rose-500" },
  ].filter((item) => item.value > 0);

  function handleExportCsv() {
    const rows: (string | number)[][] = [
      ["Month #", "Date", "Payment", "Principal", "Extra Principal", "Interest", "PMI", "Balance"],
      ...summary.scheduleMonths.map((m) => [
        m.monthIndex,
        formatMonthYear(m.calendarYear, m.calendarMonth),
        m.payment.toFixed(2),
        m.principal.toFixed(2),
        m.extraPrincipal.toFixed(2),
        m.interest.toFixed(2),
        m.pmi.toFixed(2),
        m.balance.toFixed(2),
      ]),
    ];
    downloadCsv("amortization-schedule.csv", rows);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Mortgage Calculator</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Estimate your monthly payment (PITI + PMI), see the full amortization schedule,
          and model how extra or bi-weekly payments shorten the loan and cut interest costs.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
          <SectionHeading>Loan</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <NumberField
                label="Home Price"
                value={inputs.homePrice}
                onChange={(v) => set("homePrice", v)}
                prefix="$"
                step={1000}
              />
            </div>
            <NumberField
              label="Down Payment"
              value={inputs.downPaymentPercent}
              onChange={(v) => set("downPaymentPercent", v)}
              suffix="%"
              step={1}
              help={formatCurrency(downPaymentAmount)}
            />
            <NumberField
              label="Down Payment $"
              value={Math.round(downPaymentAmount)}
              onChange={(v) =>
                set(
                  "downPaymentPercent",
                  inputs.homePrice > 0 ? (v / inputs.homePrice) * 100 : 0
                )
              }
              prefix="$"
              step={1000}
            />
            <NumberField
              label="Interest Rate"
              value={inputs.interestRatePercent}
              onChange={(v) => set("interestRatePercent", v)}
              suffix="%"
              step={0.125}
            />
            <NumberField
              label="Loan Term"
              value={inputs.loanTermYears}
              onChange={(v) => set("loanTermYears", v)}
              suffix="yrs"
              step={1}
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Start Month</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
                value={inputs.startMonth}
                onChange={(e) => set("startMonth", Number(e.target.value))}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Start Year"
              value={inputs.startYear}
              onChange={(v) => set("startYear", v)}
              step={1}
            />
          </div>

          <SectionHeading>Taxes, Insurance &amp; Fees</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Property Tax"
              value={inputs.propertyTaxAnnual}
              onChange={(v) => set("propertyTaxAnnual", v)}
              prefix="$"
              suffix="/yr"
              step={100}
            />
            <NumberField
              label="Home Insurance"
              value={inputs.homeInsuranceAnnual}
              onChange={(v) => set("homeInsuranceAnnual", v)}
              prefix="$"
              suffix="/yr"
              step={100}
            />
            <NumberField
              label="HOA Dues"
              value={inputs.hoaMonthly}
              onChange={(v) => set("hoaMonthly", v)}
              prefix="$"
              suffix="/mo"
              step={10}
            />
            <NumberField
              label="PMI Rate"
              value={inputs.pmiAnnualPercent}
              onChange={(v) => set("pmiAnnualPercent", v)}
              suffix="%/yr"
              step={0.05}
              help="Auto-cancels at 78% LTV"
            />
          </div>

          <SectionHeading>Extra Payments</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Extra Monthly"
              value={inputs.extraMonthlyPayment}
              onChange={(v) => set("extraMonthlyPayment", v)}
              prefix="$"
              suffix="/mo"
              step={25}
            />
            <NumberField
              label="One-Time Extra"
              value={inputs.extraOneTimePayment}
              onChange={(v) => set("extraOneTimePayment", v)}
              prefix="$"
              step={500}
            />
            <NumberField
              label="Applied in Month #"
              value={inputs.extraOneTimeMonth}
              onChange={(v) => set("extraOneTimeMonth", Math.max(1, Math.round(v)))}
              step={1}
              min={1}
              help="Months since loan start"
            />
            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={inputs.biweekly}
                onChange={(e) => set("biweekly", e.target.checked)}
              />
              <span className="font-medium text-slate-700">Bi-weekly payments</span>
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Loan Amount" value={formatCurrency(summary.loanAmount)} />
            <MetricCard label="Monthly P&I" value={formatCurrency(summary.monthlyPI)} />
            <MetricCard
              label="Total Monthly Payment"
              value={formatCurrency(summary.totalMonthlyPayment)}
              help="PITI + PMI"
            />
            <MetricCard
              label="Payoff Date"
              value={formatMonthYear(summary.payoffDate.year, summary.payoffDate.month)}
            />
            <MetricCard
              label="Total Interest Paid"
              value={formatCurrency(summary.totalInterestPaid)}
              tone="negative"
            />
            {summary.totalPmiPaid > 0 && (
              <MetricCard
                label="Total PMI Paid"
                value={formatCurrency(summary.totalPmiPaid)}
                tone="negative"
                help={
                  summary.pmiDropoffDate
                    ? `Drops off ${formatMonthYear(summary.pmiDropoffDate.year, summary.pmiDropoffDate.month)}`
                    : undefined
                }
              />
            )}
            {impact && (
              <>
                <MetricCard
                  label="Interest Saved"
                  value={formatCurrency(impact.interestSaved)}
                  tone="positive"
                  help="vs. no extra payments"
                />
                <MetricCard
                  label="Time Saved"
                  value={
                    impact.monthsSaved >= 12
                      ? `${Math.floor(impact.monthsSaved / 12)}y ${impact.monthsSaved % 12}mo`
                      : `${impact.monthsSaved} mo`
                  }
                  tone="positive"
                  help={`Was ${formatMonthYear(impact.baselinePayoffDate.year, impact.baselinePayoffDate.month)}`}
                />
              </>
            )}
          </div>

          {breakdown.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Monthly Payment Breakdown
              </h3>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className={item.color}
                    style={{ width: `${(item.value / summary.totalMonthlyPayment) * 100}%` }}
                    title={`${item.label}: ${formatCurrency(item.value)}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
                {breakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span>
                      {item.label} — {formatCurrency(item.value)} (
                      {formatPercent((item.value / summary.totalMonthlyPayment) * 100)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Amortization Schedule</h3>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
                  <button
                    onClick={() => setScheduleView("yearly")}
                    className={`px-3 py-1.5 font-medium ${
                      scheduleView === "yearly"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    onClick={() => setScheduleView("monthly")}
                    className={`px-3 py-1.5 font-medium ${
                      scheduleView === "monthly"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="max-h-[480px] overflow-y-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    {scheduleView === "yearly" ? (
                      <>
                        <th className="px-3 py-2 text-left font-medium">Year</th>
                        <th className="px-3 py-2 text-right font-medium">Principal</th>
                        <th className="px-3 py-2 text-right font-medium">Interest</th>
                        <th className="px-3 py-2 text-right font-medium">PMI</th>
                        <th className="px-3 py-2 text-right font-medium">Ending Balance</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-right font-medium">Payment</th>
                        <th className="px-3 py-2 text-right font-medium">Principal</th>
                        <th className="px-3 py-2 text-right font-medium">Extra</th>
                        <th className="px-3 py-2 text-right font-medium">Interest</th>
                        <th className="px-3 py-2 text-right font-medium">Balance</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {scheduleView === "yearly"
                    ? summary.scheduleYears.map((row) => (
                        <tr key={row.loanYear} className="text-slate-700">
                          <td className="px-3 py-1.5">
                            {row.loanYear} ({row.calendarYearStart})
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.principalPaid)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.interestPaid)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {row.pmiPaid > 0 ? formatCurrency(row.pmiPaid) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.endingBalance)}
                          </td>
                        </tr>
                      ))
                    : summary.scheduleMonths.map((row) => (
                        <tr key={row.monthIndex} className="text-slate-700">
                          <td className="px-3 py-1.5">
                            {formatMonthYear(row.calendarYear, row.calendarMonth)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.payment)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.principal)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {row.extraPrincipal > 0 ? formatCurrency(row.extraPrincipal) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(row.balance)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
