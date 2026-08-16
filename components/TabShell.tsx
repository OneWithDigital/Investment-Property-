"use client";

import { useState } from "react";
import { Header } from "./Header";
import { GrantsFinder } from "./GrantsFinder";
import { SingleFamilyTab } from "./tabs/SingleFamilyTab";
import { DuplexTab } from "./tabs/DuplexTab";
import { MultiUnitTab } from "./tabs/MultiUnitTab";
import { CommercialTab } from "./tabs/CommercialTab";
import { ShortTermRentalTab } from "./tabs/ShortTermRentalTab";

const TABS = [
  { id: "single-family", label: "Single-Family" },
  { id: "duplex", label: "Duplex" },
  { id: "multi-unit", label: "Multi-Unit" },
  { id: "commercial", label: "Commercial" },
  { id: "short-term-rental", label: "Short-Term Rental" },
  { id: "grants", label: "Grants & Funding" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TabShell() {
  const [active, setActive] = useState<TabId>("single-family");

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {active === "single-family" && <SingleFamilyTab />}
        {active === "duplex" && <DuplexTab />}
        {active === "multi-unit" && <MultiUnitTab />}
        {active === "commercial" && <CommercialTab />}
        {active === "short-term-rental" && <ShortTermRentalTab />}
        {active === "grants" && <GrantsFinder />}
      </main>
    </div>
  );
}
