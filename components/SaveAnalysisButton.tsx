"use client";

import { useState } from "react";
import type { PropertyTypeTag } from "@/lib/grants";

export function SaveAnalysisButton({
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const label = window.prompt("Name this analysis", address || "Untitled analysis");
    if (!label) return;

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/saved-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyType,
          label,
          address: address || null,
          inputs,
          result,
          verdict,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save this analysis.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save analysis"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
