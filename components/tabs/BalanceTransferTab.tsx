"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_BALANCE_TRANSFER_INPUTS,
  MAX_BALANCE_TRANSFER_CARDS,
  simulateBalanceTransferPlan,
  type BalanceTransferCardInput,
  type BalanceTransferInputs,
} from "@/lib/calc/balanceTransfer";
import { buildIcsCalendar, downloadIcs, googleCalendarUrl } from "@/lib/ics";
import { NumberField, SectionHeading } from "@/components/FieldGroup";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency, formatPercent } from "@/lib/format";

let nextCardSeq = 1;
function newCardId(): string {
  nextCardSeq += 1;
  return `card-${Date.now()}-${nextCardSeq}`;
}

function CardEditor({
  card,
  index,
  onChange,
  onRemove,
  removable,
}: {
  card: BalanceTransferCardInput;
  index: number;
  onChange: (card: BalanceTransferCardInput) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const set = <K extends keyof BalanceTransferCardInput>(
    key: K,
    value: BalanceTransferCardInput[K]
  ) => onChange({ ...card, [key]: value });

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
        <input
          type="text"
          className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-400"
          value={card.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-rose-600 text-sm px-1"
            aria-label={`Remove ${card.name}`}
          >
            ✕
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Credit limit"
          prefix="$"
          value={card.creditLimit}
          onChange={(v) => set("creditLimit", v)}
          step={500}
        />
        <NumberField
          label="Transfer fee"
          suffix="%"
          value={card.transferFeePercent}
          onChange={(v) => set("transferFeePercent", v)}
          step={0.5}
        />
        <NumberField
          label="Promo APR"
          suffix="%"
          value={card.promoAprPercent}
          onChange={(v) => set("promoAprPercent", v)}
          step={0.5}
        />
        <NumberField
          label="Promo length"
          suffix="mo"
          value={card.promoMonths}
          onChange={(v) => set("promoMonths", v)}
          step={1}
        />
        <NumberField
          label="APR after promo"
          suffix="%"
          value={card.postPromoAprPercent}
          onChange={(v) => set("postPromoAprPercent", v)}
          step={0.5}
        />
        <NumberField
          label="Annual fee"
          prefix="$"
          value={card.annualFee}
          onChange={(v) => set("annualFee", v)}
          step={5}
        />
      </div>
    </div>
  );
}

export function BalanceTransferTab() {
  const [inputs, setInputs] = useState<BalanceTransferInputs>(
    DEFAULT_BALANCE_TRANSFER_INPUTS
  );

  const set = <K extends keyof BalanceTransferInputs>(
    key: K,
    value: BalanceTransferInputs[K]
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  function updateCard(index: number, card: BalanceTransferCardInput) {
    const cards = [...inputs.cards];
    cards[index] = card;
    set("cards", cards);
  }

  function addCard() {
    if (inputs.cards.length >= MAX_BALANCE_TRANSFER_CARDS) return;
    set("cards", [
      ...inputs.cards,
      {
        id: newCardId(),
        name: `Card ${inputs.cards.length + 1}`,
        creditLimit: 8000,
        transferFeePercent: 4,
        promoAprPercent: 0,
        promoMonths: 15,
        postPromoAprPercent: 22.99,
        annualFee: 0,
      },
    ]);
  }

  function removeCard(index: number) {
    set(
      "cards",
      inputs.cards.filter((_, i) => i !== index)
    );
  }

  const result = useMemo(() => simulateBalanceTransferPlan(inputs), [inputs]);

  function handleDownloadIcs() {
    if (result.reminders.length === 0) return;
    const ics = buildIcsCalendar(result.reminders, "Balance Transfer Reminders");
    downloadIcs("balance-transfer-reminders.ics", ics);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Balance Transfer Rotation Planner</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Rotate credit card debt across a sequence of 0% balance-transfer
          promotions instead of paying regular interest. Enter your debt and
          each card&apos;s promo terms — the plan below simulates paying down
          the balance during each promo and transferring what&apos;s left to
          the next card before the rate expires, with calendar reminders so
          you don&apos;t miss a deadline.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20 space-y-4">
          <SectionHeading>Your debt</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Starting balance"
              prefix="$"
              value={inputs.startingBalance}
              onChange={(v) => set("startingBalance", v)}
              step={100}
            />
            <NumberField
              label="Monthly payment"
              prefix="$"
              value={inputs.monthlyPayment}
              onChange={(v) => set("monthlyPayment", v)}
              step={25}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">First transfer date</span>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              value={inputs.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </label>
          <NumberField
            label="Remind me before each promo ends"
            suffix="days early"
            value={inputs.reminderLeadDays}
            onChange={(v) => set("reminderLeadDays", v)}
            step={5}
            help="Gives you time to apply for and complete the next transfer"
          />

          <SectionHeading>Cards, in transfer order</SectionHeading>
          <div className="space-y-3">
            {inputs.cards.map((card, i) => (
              <CardEditor
                key={card.id}
                card={card}
                index={i}
                onChange={(c) => updateCard(i, c)}
                onRemove={() => removeCard(i)}
                removable={inputs.cards.length > 1}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addCard}
            disabled={inputs.cards.length >= MAX_BALANCE_TRANSFER_CARDS}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {inputs.cards.length >= MAX_BALANCE_TRANSFER_CARDS
              ? `Maximum ${MAX_BALANCE_TRANSFER_CARDS} cards`
              : "+ Add another card"}
          </button>
        </div>

        <div className="space-y-6">
          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label={result.fullyPaidOff ? "Debt-free by" : "Balance remaining"}
              value={
                result.fullyPaidOff && result.payoffDate
                  ? result.payoffDate
                  : formatCurrency(result.remainingBalance)
              }
              tone={result.fullyPaidOff ? "positive" : "negative"}
              help={result.fullyPaidOff ? `${result.totalMonths} months of payments` : "Not paid off with this plan"}
            />
            <MetricCard
              label="Total transfer fees"
              value={formatCurrency(result.totalTransferFees)}
            />
            <MetricCard
              label="Total annual fees"
              value={formatCurrency(result.totalAnnualFees)}
            />
            <MetricCard
              label="Interest paid"
              value={formatCurrency(result.totalInterestPaid)}
              tone={result.totalInterestPaid > 0 ? "negative" : "positive"}
              help={
                result.totalInterestPaid > 0
                  ? "Accrued outside a 0% window"
                  : "None — stayed inside 0% windows"
              }
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <MetricCard
              label="Total cost of this plan"
              value={formatCurrency(result.totalCostOfPlan)}
              help="Transfer fees + annual fees + any interest — compare this to what you'd pay carrying the balance at a card's regular APR"
            />
            {result.suggestedMinPayoffPayment > inputs.monthlyPayment && (
              <p className="mt-3 text-xs text-slate-500">
                At your current payment, you won&apos;t clear the balance
                within the combined promo windows. Paying at least{" "}
                <strong>{formatCurrency(result.suggestedMinPayoffPayment)}/month</strong>{" "}
                would keep you inside 0% interest the whole way (rough
                estimate, before later transfer fees).
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <h3 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
              Rotation schedule
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2">Card</th>
                    <th className="px-4 py-2">Transfer date</th>
                    <th className="px-4 py-2">Transfer fee</th>
                    <th className="px-4 py-2">Starting balance</th>
                    <th className="px-4 py-2">Promo ends</th>
                    <th className="px-4 py-2">Ending balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.stages.map((s) => (
                    <tr key={s.stageNumber} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-medium">
                        {s.stageNumber}. {s.cardName}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{s.transferDate}</td>
                      <td className="px-4 py-2 tabular-nums">{formatCurrency(s.transferFee)}</td>
                      <td className="px-4 py-2 tabular-nums">{formatCurrency(s.startingCardBalance)}</td>
                      <td className="px-4 py-2 tabular-nums">{s.promoEndDate}</td>
                      <td
                        className={`px-4 py-2 tabular-nums ${
                          s.endingBalance <= 0.005 ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(s.endingBalance)}
                        {s.postPromoMonths > 0 && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({s.postPromoMonths}mo at regular APR, {formatCurrency(s.postPromoInterestPaid)} interest)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Calendar reminders</h3>
              {result.reminders.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Download all (.ics)
                </button>
              )}
            </div>
            {result.reminders.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">
                No transfers to plan for — your last card either pays off the
                balance or is your only card.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {result.reminders.map((r, i) => (
                  <li key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.date} — {r.detail}
                      </p>
                    </div>
                    <a
                      href={googleCalendarUrl(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      Add to Google Calendar
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Estimates only. Real card issuers may cap balance transfers at a
            percentage of your limit, decline transfers between cards from
            the same bank, or change promo terms. Confirm the exact APR,
            fee, and promo length on your card&apos;s current offer terms
            before relying on this plan.
          </p>
        </div>
      </div>
    </div>
  );
}
