import { analyzeProperty } from "./calculations";
import { evaluateVerdict } from "./verdict";
import type { PropertyInputs, CalculationResult, Verdict } from "./types";
import { analyzeDuplex, evaluateDuplexVerdict, type DuplexInputs, type DuplexResult } from "./calc/duplex";
import {
  analyzeMultiUnit,
  evaluateMultiUnitVerdict,
  type MultiUnitInputs,
  type MultiUnitResult,
} from "./calc/multiUnit";
import {
  analyzeCommercial,
  evaluateCommercialVerdict,
  type CommercialInputs,
  type CommercialResult,
} from "./calc/commercial";
import {
  analyzeShortTermRental,
  evaluateShortTermRentalVerdict,
  type ShortTermRentalInputs,
  type ShortTermRentalResult,
} from "./calc/shortTermRental";

/**
 * A quick stress test, not a full Monte Carlo simulation: three fixed
 * scenarios that shift the levers investors actually worry about
 * (rent/revenue, vacancy/occupancy, interest rate) by a set amount, so
 * you can see whether a deal still works if things go worse than
 * assumed — without hand-editing the form and losing your original
 * numbers. All calculation functions here are pure (no network/DB), so
 * scenario switching recomputes instantly in the browser.
 */
export type ScenarioKey = "downside" | "base" | "upside";

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  downside: "Downside",
  base: "Base case",
  upside: "Upside",
};

export const SCENARIO_DESCRIPTIONS: Record<ScenarioKey, string> = {
  downside: "What you entered, but rent 5% lower, vacancy 3 points higher, and rate 1 point higher.",
  base: "Exactly what you entered — no adjustment.",
  upside: "What you entered, but rent 5% higher and vacancy 2 points lower.",
};

const RENT_MULTIPLIER: Record<ScenarioKey, number> = { downside: 0.95, base: 1, upside: 1.05 };
const VACANCY_DELTA_PTS: Record<ScenarioKey, number> = { downside: 3, base: 0, upside: -2 };
const RATE_DELTA_PTS: Record<ScenarioKey, number> = { downside: 1, base: 0, upside: 0 };

function clampPercent(v: number): number {
  return Math.min(100, Math.max(0, v));
}

function shiftRate(ratePercent: number, scenario: ScenarioKey): number {
  return Math.max(0, ratePercent + RATE_DELTA_PTS[scenario]);
}

export function scenarioInputsSingleFamily(inputs: PropertyInputs, scenario: ScenarioKey): PropertyInputs {
  if (scenario === "base") return inputs;
  return {
    ...inputs,
    monthlyRent: inputs.monthlyRent * RENT_MULTIPLIER[scenario],
    vacancyPercent: clampPercent(inputs.vacancyPercent + VACANCY_DELTA_PTS[scenario]),
    interestRatePercent: shiftRate(inputs.interestRatePercent, scenario),
  };
}

export function runScenarioSingleFamily(
  inputs: PropertyInputs,
  scenario: ScenarioKey
): { result: CalculationResult; verdict: Verdict } {
  const scenarioInputs = scenarioInputsSingleFamily(inputs, scenario);
  const result = analyzeProperty(scenarioInputs);
  return { result, verdict: evaluateVerdict(result) };
}

export function scenarioInputsDuplex(inputs: DuplexInputs, scenario: ScenarioKey): DuplexInputs {
  if (scenario === "base") return inputs;
  return {
    ...inputs,
    units: inputs.units.map((u) => ({ ...u, monthlyRent: u.monthlyRent * RENT_MULTIPLIER[scenario] })),
    vacancyPercent: clampPercent(inputs.vacancyPercent + VACANCY_DELTA_PTS[scenario]),
    interestRatePercent: shiftRate(inputs.interestRatePercent, scenario),
  };
}

export function runScenarioDuplex(
  inputs: DuplexInputs,
  scenario: ScenarioKey
): { result: DuplexResult; verdict: Verdict } {
  const scenarioInputs = scenarioInputsDuplex(inputs, scenario);
  const result = analyzeDuplex(scenarioInputs);
  return { result, verdict: evaluateDuplexVerdict(result, scenarioInputs) };
}

export function scenarioInputsMultiUnit(inputs: MultiUnitInputs, scenario: ScenarioKey): MultiUnitInputs {
  if (scenario === "base") return inputs;
  return {
    ...inputs,
    unitMix: inputs.unitMix.map((u) => ({ ...u, avgMonthlyRent: u.avgMonthlyRent * RENT_MULTIPLIER[scenario] })),
    economicVacancyPercent: clampPercent(inputs.economicVacancyPercent + VACANCY_DELTA_PTS[scenario]),
    interestRatePercent: shiftRate(inputs.interestRatePercent, scenario),
  };
}

export function runScenarioMultiUnit(
  inputs: MultiUnitInputs,
  scenario: ScenarioKey
): { result: MultiUnitResult; verdict: Verdict } {
  const scenarioInputs = scenarioInputsMultiUnit(inputs, scenario);
  const result = analyzeMultiUnit(scenarioInputs);
  return { result, verdict: evaluateMultiUnitVerdict(result, scenarioInputs) };
}

export function scenarioInputsCommercial(inputs: CommercialInputs, scenario: ScenarioKey): CommercialInputs {
  if (scenario === "base") return inputs;
  return {
    ...inputs,
    tenants: inputs.tenants.map((t) => ({ ...t, annualRentPerSqft: t.annualRentPerSqft * RENT_MULTIPLIER[scenario] })),
    marketRentPerSqftAnnual: inputs.marketRentPerSqftAnnual * RENT_MULTIPLIER[scenario],
    // Commercial has no single vacancy % (vacant space is entered as sqft,
    // which a rent-shift scenario can't reasonably scale) — credit loss %
    // is the closest available lever for "income doesn't show up as
    // planned," so it stands in as the vacancy-equivalent stress here.
    creditLossPercent: clampPercent(inputs.creditLossPercent + VACANCY_DELTA_PTS[scenario]),
    interestRatePercent: shiftRate(inputs.interestRatePercent, scenario),
  };
}

export function runScenarioCommercial(
  inputs: CommercialInputs,
  scenario: ScenarioKey
): { result: CommercialResult; verdict: Verdict } {
  const scenarioInputs = scenarioInputsCommercial(inputs, scenario);
  const result = analyzeCommercial(scenarioInputs);
  return { result, verdict: evaluateCommercialVerdict(result, scenarioInputs) };
}

export function scenarioInputsShortTermRental(
  inputs: ShortTermRentalInputs,
  scenario: ScenarioKey
): ShortTermRentalInputs {
  if (scenario === "base") return inputs;
  return {
    ...inputs,
    averageDailyRate: inputs.averageDailyRate * RENT_MULTIPLIER[scenario],
    // STR's vacancy-equivalent lever is occupancy, which moves the
    // opposite direction from vacancy: a downside scenario means LOWER
    // occupancy, so this subtracts where the vacancy-based calculators add.
    occupancyPercent: clampPercent(inputs.occupancyPercent - VACANCY_DELTA_PTS[scenario]),
    interestRatePercent: shiftRate(inputs.interestRatePercent, scenario),
  };
}

export function runScenarioShortTermRental(
  inputs: ShortTermRentalInputs,
  scenario: ScenarioKey
): { result: ShortTermRentalResult; verdict: Verdict } {
  const scenarioInputs = scenarioInputsShortTermRental(inputs, scenario);
  const result = analyzeShortTermRental(scenarioInputs);
  return { result, verdict: evaluateShortTermRentalVerdict(result, scenarioInputs) };
}
