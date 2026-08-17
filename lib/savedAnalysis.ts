import { PropertyType as PrismaPropertyType } from "@prisma/client";
import type { PropertyTypeTag } from "@/lib/grants";

/**
 * The rest of the app (grants finder, tabs) uses kebab-case slugs like
 * "single-family". Prisma enums can't be kebab-case, so this is the one
 * place that translates between the two at the API boundary.
 */
export const SLUG_TO_PRISMA_TYPE: Record<
  Exclude<PropertyTypeTag, "any">,
  PrismaPropertyType
> = {
  "single-family": PrismaPropertyType.SINGLE_FAMILY,
  duplex: PrismaPropertyType.DUPLEX,
  "multi-unit": PrismaPropertyType.MULTI_UNIT,
  commercial: PrismaPropertyType.COMMERCIAL,
  "short-term-rental": PrismaPropertyType.SHORT_TERM_RENTAL,
};

export const PRISMA_TYPE_TO_SLUG: Record<
  PrismaPropertyType,
  Exclude<PropertyTypeTag, "any">
> = {
  [PrismaPropertyType.SINGLE_FAMILY]: "single-family",
  [PrismaPropertyType.DUPLEX]: "duplex",
  [PrismaPropertyType.MULTI_UNIT]: "multi-unit",
  [PrismaPropertyType.COMMERCIAL]: "commercial",
  [PrismaPropertyType.SHORT_TERM_RENTAL]: "short-term-rental",
};

export const PROPERTY_TYPE_TAB_LABELS: Record<Exclude<PropertyTypeTag, "any">, string> = {
  "single-family": "Single-Family",
  duplex: "Duplex",
  "multi-unit": "Multi-Unit",
  commercial: "Commercial",
  "short-term-rental": "Short-Term Rental",
};

export function isValidSlug(value: string): value is Exclude<PropertyTypeTag, "any"> {
  return value in SLUG_TO_PRISMA_TYPE;
}

export interface SavedAnalysisPayload {
  propertyType: Exclude<PropertyTypeTag, "any">;
  label: string;
  address: string | null;
  inputs: unknown;
  result: unknown;
  verdict: unknown;
}

export interface SavedAnalysisSummary {
  id: string;
  propertyType: Exclude<PropertyTypeTag, "any">;
  label: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  capRatePercent: number | null;
  cashOnCashReturnPercent: number | null;
  monthlyCashFlow: number | null;
  dscr: number | null;
  verdictLabel: string | null;
}

/**
 * Every property type's result shape has these fields under slightly
 * different names in a couple of cases, but cap rate / cash-on-cash /
 * monthly cash flow / DSCR are named identically across all five
 * calculators (see lib/calc/*.ts and lib/calculations.ts) — so a single
 * loose extractor works for the summary/comparison views without needing
 * per-type branching.
 */
export function extractSummaryMetrics(result: any, verdict: any) {
  return {
    capRatePercent: typeof result?.capRatePercent === "number" ? result.capRatePercent : null,
    cashOnCashReturnPercent:
      typeof result?.cashOnCashReturnPercent === "number" ? result.cashOnCashReturnPercent : null,
    monthlyCashFlow: typeof result?.monthlyCashFlow === "number" ? result.monthlyCashFlow : null,
    dscr: typeof result?.dscr === "number" ? result.dscr : null,
    verdictLabel: typeof verdict?.label === "string" ? verdict.label : null,
  };
}
