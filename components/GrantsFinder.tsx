"use client";

import { useMemo, useState } from "react";
import {
  filterFundingPrograms,
  PROJECT_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  type ProjectTypeTag,
  type PropertyTypeTag,
} from "@/lib/grants";

const TYPE_COLORS: Record<string, string> = {
  Grant: "bg-emerald-100 text-emerald-800",
  "Low-Interest Loan": "bg-sky-100 text-sky-800",
  "Loan Insurance/Guarantee": "bg-indigo-100 text-indigo-800",
  "Tax Credit": "bg-amber-100 text-amber-800",
  "Tax Incentive": "bg-amber-100 text-amber-800",
  "Financing Program": "bg-slate-100 text-slate-800",
};

export function GrantsFinder() {
  const [propertyType, setPropertyType] = useState<PropertyTypeTag | "all">("all");
  const [projectType, setProjectType] = useState<ProjectTypeTag | "all">("all");
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => filterFundingPrograms(propertyType, projectType, query),
    [propertyType, projectType, query]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Grants &amp; Funding Finder</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          A curated reference of real federal (plus representative state/local) programs
          that can help fund acquisition, new construction, remodels, and energy-efficiency
          work. This is a research starting point, not a live feed — program terms and
          availability change and vary a lot by state and city. Search the agency's
          official site for current details before relying on any of this.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyTypeTag | "all")}
        >
          <option value="all">All property types</option>
          {Object.entries(PROPERTY_TYPE_LABELS)
            .filter(([key]) => key !== "any")
            .map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value as ProjectTypeTag | "all")}
        >
          <option value="all">All project types</option>
          {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search programs…"
          className="flex-1 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="text-xs text-slate-400">
        {results.length} program{results.length === 1 ? "" : "s"} match
        {results.length === 1 ? "es" : ""}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((program) => (
          <div key={program.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">{program.name}</h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLORS[program.type] ?? "bg-slate-100 text-slate-800"}`}
              >
                {program.type}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {program.level} · {program.agency}
            </div>
            <p className="mt-2 text-sm text-slate-600">{program.description}</p>
            <div className="mt-3 space-y-1 text-xs">
              <div>
                <span className="font-medium text-slate-700">Typical benefit: </span>
                <span className="text-slate-600">{program.typicalBenefit}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Eligibility: </span>
                <span className="text-slate-600">{program.eligibility}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {program.propertyTypes.map((pt) => (
                <span
                  key={pt}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                >
                  {PROPERTY_TYPE_LABELS[pt]}
                </span>
              ))}
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            No programs match those filters. Try broadening your search.
          </div>
        )}
      </div>
    </div>
  );
}
