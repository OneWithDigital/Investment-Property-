"use client";

import type { PropertyTypeTag } from "@/lib/grants";
import { SaveAnalysisButton } from "./SaveAnalysisButton";

export function AnalysisToolbar({
  propertyType,
  address,
  inputs,
  result,
  verdict,
}: {
  propertyType: Exclude<PropertyTypeTag, "any">;
  address: string;
  inputs: unknown;
  result: unknown;
  verdict: unknown;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <SaveAnalysisButton
        propertyType={propertyType}
        address={address}
        inputs={inputs}
        result={result}
        verdict={verdict}
      />
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Print / Save PDF
      </button>
    </div>
  );
}
