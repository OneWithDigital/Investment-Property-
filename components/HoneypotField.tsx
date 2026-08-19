"use client";

/**
 * Bait field for scripted form-fillers — real users never see or reach it
 * (off-screen, aria-hidden, out of tab order), but bots that blindly fill
 * every input tend to fill this too. Paired with a submit-timing check in
 * lib/botCheck.ts.
 */
export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
    >
      <label>
        Company
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
