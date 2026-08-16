import { NextRequest, NextResponse } from "next/server";
import { analyzeProperty, DEFAULT_INPUTS } from "@/lib/calculations";
import { evaluateVerdict } from "@/lib/verdict";
import { extractStateFromAddress, findStateFactor } from "@/lib/locationFactors";
import type { PropertyInputs } from "@/lib/types";

const NUMERIC_FIELDS: (keyof PropertyInputs)[] = [
  "purchasePrice",
  "downPaymentPercent",
  "interestRatePercent",
  "loanTermYears",
  "closingCostPercent",
  "rehabCost",
  "monthlyRent",
  "otherMonthlyIncome",
  "propertyTaxAnnual",
  "insuranceAnnual",
  "hoaMonthly",
  "utilitiesMonthlyOwnerPaid",
  "maintenancePercent",
  "capExPercent",
  "vacancyPercent",
  "managementPercent",
  "annualRentGrowthPercent",
  "annualExpenseGrowthPercent",
  "annualAppreciationPercent",
  "sellingCostPercent",
  "holdPeriodYears",
];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const inputs: PropertyInputs = { ...DEFAULT_INPUTS, ...body };
  inputs.address = typeof body.address === "string" ? body.address : "";

  for (const field of NUMERIC_FIELDS) {
    const value = (inputs as any)[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { error: `Field "${field}" must be a non-negative number.` },
        { status: 400 }
      );
    }
  }

  if (inputs.downPaymentPercent > 100) {
    return NextResponse.json(
      { error: "Down payment percent cannot exceed 100." },
      { status: 400 }
    );
  }
  if (inputs.purchasePrice <= 0) {
    return NextResponse.json(
      { error: "Purchase price must be greater than 0." },
      { status: 400 }
    );
  }
  if (inputs.loanTermYears <= 0 || inputs.holdPeriodYears <= 0) {
    return NextResponse.json(
      { error: "Loan term and hold period must be greater than 0." },
      { status: 400 }
    );
  }

  const result = analyzeProperty(inputs);
  const verdict = evaluateVerdict(result);

  const stateAbbr = extractStateFromAddress(inputs.address);
  const stateFactor = stateAbbr ? findStateFactor(stateAbbr) : null;

  return NextResponse.json({ inputs, result, verdict, stateFactor });
}
