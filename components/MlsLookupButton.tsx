"use client";

import { useState } from "react";
import type { ComparableProperty, MlsLookupResult } from "@/lib/mlsLookup";

function ComparablesList({ title, comps }: { title: string; comps: ComparableProperty[] }) {
  const [open, setOpen] = useState(false);
  if (comps.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        {open ? "▾" : "▸"} {title} ({comps.length})
      </button>
      {open && (
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-xs min-w-[360px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                <th className="py-1 pr-2">Address</th>
                <th className="py-1 pr-2">Price</th>
                <th className="py-1 pr-2">Bd/Ba</th>
                <th className="py-1 pr-2">Sqft</th>
                <th className="py-1">Distance</th>
              </tr>
            </thead>
            <tbody>
              {comps.slice(0, 8).map((c, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-1 pr-2 text-slate-600">{c.address ?? "—"}</td>
                  <td className="py-1 pr-2 tabular-nums">
                    {c.price !== null ? `$${Math.round(c.price).toLocaleString()}` : "—"}
                  </td>
                  <td className="py-1 pr-2 tabular-nums">
                    {c.bedrooms ?? "—"}/{c.bathrooms ?? "—"}
                  </td>
                  <td className="py-1 pr-2 tabular-nums">{c.squareFootage ?? "—"}</td>
                  <td className="py-1 tabular-nums">
                    {c.distanceMiles !== null ? `${c.distanceMiles.toFixed(1)} mi` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
  const [result, setResult] = useState<MlsLookupResult | null>(null);

  async function handleClick() {
    if (!address.trim()) {
      setMessage({ text: "Enter an address above first.", tone: "warn" });
      return;
    }
    setLoading(true);
    setMessage(null);
    setResult(null);
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
        setResult(data);
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
      {result && (
        <>
          <ComparablesList title="Comparable sales" comps={result.valueComparables} />
          <ComparablesList title="Comparable rentals" comps={result.rentComparables} />
        </>
      )}
    </div>
  );
}
