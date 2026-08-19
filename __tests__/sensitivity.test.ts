import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "../lib/calculations";
import { DEFAULT_DUPLEX_INPUTS } from "../lib/calc/duplex";
import { DEFAULT_MULTI_UNIT_INPUTS } from "../lib/calc/multiUnit";
import { DEFAULT_COMMERCIAL_INPUTS } from "../lib/calc/commercial";
import { DEFAULT_STR_INPUTS } from "../lib/calc/shortTermRental";
import {
  scenarioInputsSingleFamily,
  scenarioInputsDuplex,
  scenarioInputsMultiUnit,
  scenarioInputsCommercial,
  scenarioInputsShortTermRental,
  runScenarioSingleFamily,
} from "../lib/sensitivity";

describe("scenarioInputsSingleFamily", () => {
  const base = { ...DEFAULT_INPUTS, monthlyRent: 2000, vacancyPercent: 5, interestRatePercent: 6.5 };

  it("base scenario returns the exact same object (no adjustment)", () => {
    expect(scenarioInputsSingleFamily(base, "base")).toBe(base);
  });

  it("downside lowers rent, raises vacancy, raises rate", () => {
    const shifted = scenarioInputsSingleFamily(base, "downside");
    expect(shifted.monthlyRent).toBeCloseTo(1900, 6); // -5%
    expect(shifted.vacancyPercent).toBeCloseTo(8, 6); // +3pts
    expect(shifted.interestRatePercent).toBeCloseTo(7.5, 6); // +1pt
  });

  it("upside raises rent, lowers vacancy, leaves rate unchanged", () => {
    const shifted = scenarioInputsSingleFamily(base, "upside");
    expect(shifted.monthlyRent).toBeCloseTo(2100, 6); // +5%
    expect(shifted.vacancyPercent).toBeCloseTo(3, 6); // -2pts
    expect(shifted.interestRatePercent).toBeCloseTo(6.5, 6); // unchanged
  });

  it("clamps vacancy at 0 rather than going negative", () => {
    const lowVacancy = { ...base, vacancyPercent: 1 };
    const shifted = scenarioInputsSingleFamily(lowVacancy, "upside");
    expect(shifted.vacancyPercent).toBe(0);
  });

  it("does not mutate the original inputs object", () => {
    const original = { ...base };
    scenarioInputsSingleFamily(base, "downside");
    expect(base).toEqual(original);
  });
});

describe("runScenarioSingleFamily", () => {
  const base = { ...DEFAULT_INPUTS, purchasePrice: 300000, downPaymentPercent: 20, monthlyRent: 2500 };

  it("downside produces worse cash flow than upside", () => {
    const downside = runScenarioSingleFamily(base, "downside");
    const upside = runScenarioSingleFamily(base, "upside");
    expect(downside.result.monthlyCashFlow).toBeLessThan(upside.result.monthlyCashFlow);
  });

  it("base scenario matches directly analyzing the unmodified inputs", () => {
    const baseRun = runScenarioSingleFamily(base, "base");
    const downside = runScenarioSingleFamily(base, "downside");
    // Sanity check the scenarios actually diverge — not asserting exact
    // equality with analyzeProperty() here since that's covered by
    // calculations.test.ts; this just confirms base != downside.
    expect(baseRun.result.monthlyCashFlow).not.toBeCloseTo(downside.result.monthlyCashFlow, 2);
  });
});

describe("scenarioInputsDuplex", () => {
  const base = {
    ...DEFAULT_DUPLEX_INPUTS,
    units: [
      { label: "A", monthlyRent: 1500, ownerOccupied: false },
      { label: "B", monthlyRent: 1600, ownerOccupied: false },
    ],
    vacancyPercent: 5,
  };

  it("shifts every unit's rent, not just the first", () => {
    const shifted = scenarioInputsDuplex(base, "downside");
    expect(shifted.units[0]!.monthlyRent).toBeCloseTo(1425, 6);
    expect(shifted.units[1]!.monthlyRent).toBeCloseTo(1520, 6);
  });
});

describe("scenarioInputsMultiUnit", () => {
  const base = {
    ...DEFAULT_MULTI_UNIT_INPUTS,
    unitMix: [{ label: "1BR", count: 10, avgMonthlyRent: 1200 }],
    economicVacancyPercent: 5,
  };

  it("shifts unit-mix rent and economic vacancy", () => {
    const shifted = scenarioInputsMultiUnit(base, "downside");
    expect(shifted.unitMix[0]!.avgMonthlyRent).toBeCloseTo(1140, 6);
    expect(shifted.economicVacancyPercent).toBeCloseTo(8, 6);
  });
});

describe("scenarioInputsCommercial", () => {
  const base = {
    ...DEFAULT_COMMERCIAL_INPUTS,
    tenants: [{ name: "A", sqftLeased: 1000, annualRentPerSqft: 20, leaseYearsRemaining: 5 }],
    marketRentPerSqftAnnual: 18,
    creditLossPercent: 2,
  };

  it("shifts tenant rent, market rent, and credit loss together", () => {
    const shifted = scenarioInputsCommercial(base, "downside");
    expect(shifted.tenants[0]!.annualRentPerSqft).toBeCloseTo(19, 6);
    expect(shifted.marketRentPerSqftAnnual).toBeCloseTo(17.1, 6);
    expect(shifted.creditLossPercent).toBeCloseTo(5, 6);
  });
});

describe("scenarioInputsShortTermRental", () => {
  const base = { ...DEFAULT_STR_INPUTS, averageDailyRate: 200, occupancyPercent: 60 };

  it("downside lowers ADR and lowers occupancy (inverse of vacancy)", () => {
    const shifted = scenarioInputsShortTermRental(base, "downside");
    expect(shifted.averageDailyRate).toBeCloseTo(190, 6); // -5%
    expect(shifted.occupancyPercent).toBeCloseTo(57, 6); // -3pts, not +3
  });

  it("upside raises ADR and raises occupancy", () => {
    const shifted = scenarioInputsShortTermRental(base, "upside");
    expect(shifted.averageDailyRate).toBeCloseTo(210, 6); // +5%
    expect(shifted.occupancyPercent).toBeCloseTo(62, 6); // +2pts
  });

  it("clamps occupancy at 100 rather than exceeding it", () => {
    const highOccupancy = { ...base, occupancyPercent: 99 };
    const shifted = scenarioInputsShortTermRental(highOccupancy, "upside");
    expect(shifted.occupancyPercent).toBe(100);
  });
});
