"use client";

import { useEffect, useState } from "react";

interface Placement {
  id: string;
  type: "AFFILIATE_LINK" | "ADVERTISEMENT";
  title: string;
  body: string | null;
  url: string;
  imageUrl: string | null;
}

/**
 * Renders active AdPlacement rows for a given slot (see
 * prisma/schema.prisma and /admin/monetization). Wired in but
 * intentionally dark by default: every placement is created inactive, so
 * until an admin flips one on for this slot, this renders nothing at
 * all — not even an empty container.
 */
export function AdSlot({ slot }: { slot: string }) {
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ad-placements?slot=${encodeURIComponent(slot)}`)
      .then((res) => (res.ok ? res.json() : { placements: [] }))
      .then((json) => {
        if (!cancelled) setPlacements(json.placements ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlacements([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  if (placements.length === 0) return null;

  return (
    <div className="space-y-3">
      {placements.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
        >
          {p.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{p.title}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {p.type === "AFFILIATE_LINK" ? "Partner" : "Ad"}
              </span>
            </div>
            {p.body && <p className="mt-0.5 truncate text-xs text-slate-500">{p.body}</p>}
          </div>
        </a>
      ))}
    </div>
  );
}
