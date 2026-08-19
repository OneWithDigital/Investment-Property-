"use client";

import { useState } from "react";
import { Header } from "./Header";
import { VerifyEmailBanner } from "./VerifyEmailBanner";
import { GrantsFinder } from "./GrantsFinder";
import { SingleFamilyTab } from "./tabs/SingleFamilyTab";
import { DuplexTab } from "./tabs/DuplexTab";
import { MultiUnitTab } from "./tabs/MultiUnitTab";
import { CommercialTab } from "./tabs/CommercialTab";
import { ShortTermRentalTab } from "./tabs/ShortTermRentalTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { MortgageCalculatorTab } from "./tabs/MortgageCalculatorTab";

const TABS = [
  { id: "single-family", label: "Single-Family" },
  { id: "duplex", label: "Duplex" },
  { id: "multi-unit", label: "Multi-Unit" },
  { id: "commercial", label: "Commercial" },
  { id: "short-term-rental", label: "Short-Term Rental" },
  { id: "mortgage-calculator", label: "Mortgage Calculator" },
  { id: "grants", label: "Grants & Funding" },
  { id: "history", label: "Saved" },
  { id: "portfolio", label: "Portfolio" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface LoadRequest {
  id: string;
  nonce: number;
}

export function TabShell() {
  const [active, setActive] = useState<TabId>("single-family");
  const [loadRequest, setLoadRequest] = useState<LoadRequest | null>(null);

  function handleLoad(propertyType: string, id: string) {
    if ((TABS as readonly { id: string }[]).some((t) => t.id === propertyType)) {
      setActive(propertyType as TabId);
    }
    setLoadRequest({ id, nonce: Date.now() });
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <VerifyEmailBanner />
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
        {active === "single-family" && (
          <SingleFamilyTab loadAnalysisId={active === "single-family" ? loadRequest?.id : undefined} loadNonce={loadRequest?.nonce} />
        )}
        {active === "duplex" && (
          <DuplexTab loadAnalysisId={loadRequest?.id} loadNonce={loadRequest?.nonce} />
        )}
        {active === "multi-unit" && (
          <MultiUnitTab loadAnalysisId={loadRequest?.id} loadNonce={loadRequest?.nonce} />
        )}
        {active === "commercial" && (
          <CommercialTab loadAnalysisId={loadRequest?.id} loadNonce={loadRequest?.nonce} />
        )}
        {active === "short-term-rental" && (
          <ShortTermRentalTab loadAnalysisId={loadRequest?.id} loadNonce={loadRequest?.nonce} />
        )}
        {active === "mortgage-calculator" && <MortgageCalculatorTab />}
        {active === "grants" && <GrantsFinder />}
        {active === "history" && <HistoryTab onLoad={handleLoad} />}
        {active === "portfolio" && <PortfolioTab />}
      </main>
    </div>
  );
}
