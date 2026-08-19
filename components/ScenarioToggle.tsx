"use client";

import { SCENARIO_LABELS, SCENARIO_DESCRIPTIONS, type ScenarioKey } from "@/lib/sensitivity";

const ORDER: ScenarioKey[] = ["downside", "base", "upside"];

const ACTIVE_STYLES: Record<ScenarioKey, string> = {
  downside: "bg-rose-600 text-white",
  base: "bg-slate-900 text-white",
  upside: "bg-emerald-600 text-white",
};

export function ScenarioToggle({
  value,
  onChange,
}: {
  value: ScenarioKey;
  onChange: (scenario: ScenarioKey) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stress test
          </span>
          <p className="mt-0.5 text-xs text-slate-400">{SCENARIO_DESCRIPTIONS[value]}</p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          {ORDER.map((scenario, i) => (
            <button
              key={scenario}
              type="button"
              onClick={() => onChange(scenario)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                i > 0 ? "border-l border-slate-300" : ""
              } ${value === scenario ? ACTIVE_STYLES[scenario] : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {SCENARIO_LABELS[scenario]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
