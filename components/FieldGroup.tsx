"use client";

interface FieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  min?: number;
  help?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  prefix,
  step = 1,
  min = 0,
  help,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-slate-400 overflow-hidden">
        {prefix && (
          <span className="pl-3 text-slate-400 text-sm select-none">{prefix}</span>
        )}
        <input
          type="number"
          className="w-full px-3 py-2 outline-none text-slate-900 tabular-nums"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        />
        {suffix && (
          <span className="pr-3 text-slate-400 text-sm select-none">{suffix}</span>
        )}
      </div>
      {help && <span className="text-xs text-slate-400">{help}</span>}
    </label>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-6 mb-2 first:mt-0">
      {children}
    </h3>
  );
}
