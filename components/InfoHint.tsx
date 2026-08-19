"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A "?" trigger next to a label that reveals what a field/metric is and
 * why it matters. Click-to-toggle (not hover-only) so it works on touch
 * devices, closes on outside click or Escape. Centered under the trigger
 * with a viewport-relative max-width so it doesn't overflow off-screen
 * from a field near the edge of the two-column input grids.
 */
export function InfoHint({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          // NumberField wraps this in a <label>; without stopping
          // propagation, clicking "?" would also focus the label's
          // associated number input as a side effect.
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={`What is ${title}, and why does it matter?`}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-400 hover:border-slate-500 hover:text-slate-600"
      >
        ?
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-1.5 w-64 max-w-[90vw] -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          <p className="text-xs font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{body}</p>
        </div>
      )}
    </span>
  );
}
