"use client";

import { useState } from "react";
import type { MlsLookupResult } from "@/lib/mlsLookup";

export function MlsLookupButton({
  address,
  onApply,
}: {
  address: string;
  onApply: (result: MlsLookupResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "warn" } | null>(
    null
  );

  async function handleClick() {
    if (!address.trim()) {
      setMessage({ text: "Enter an address above first.", tone: "warn" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/mls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data: MlsLookupResult = await res.json();
      onApply(data);

      if (!data.configured || !data.fetched) {
        setMessage({ text: data.error ?? "Comps lookup failed.", tone: "warn" });
      } else {
        const value = data.estimatedValue
          ? `$${Math.round(data.estimatedValue).toLocaleString()}`
          : "—";
        const rent = data.estimatedRent
          ? `$${Math.round(data.estimatedRent).toLocaleString()}/mo`
          : "—";
        setMessage({ text: `Comps found: est. value ${value}, est. rent ${rent}.`, tone: "success" });
      }
    } catch {
      setMessage({ text: "Couldn't reach the comps data service.", tone: "warn" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Searching MLS comps…" : "Search MLS comps (RentCast)"}
      </button>
      {message && (
        <p
          className={`mt-2 text-xs rounded-md px-3 py-2 border ${
            message.tone === "success"
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
