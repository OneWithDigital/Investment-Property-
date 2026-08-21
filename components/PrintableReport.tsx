import type { Verdict } from "@/lib/types";

export interface ReportMetric {
  label: string;
  value: string;
}

export interface PrintableReportProps {
  title: string;
  address: string;
  verdict?: Verdict;
  metrics: ReportMetric[];
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  footerNote?: string;
}

const DEFAULT_FOOTER_NOTE =
  "Educational tool, not financial or legal advice. Verify all inputs against real comps, quotes, and local regulations before purchasing.";

/**
 * Always present in the DOM but hidden on screen (see the .print-report
 * rule in globals.css) — becomes the only visible content when the user
 * hits Ctrl/Cmd+P or the "Print / Save PDF" button, which just calls
 * window.print(). This avoids a server-side PDF renderer (puppeteer,
 * etc.) entirely, which is a meaningfully more fragile dependency to run
 * in arbitrary deploy environments than the browser's own print engine.
 */
export function PrintableReport({
  title,
  address,
  verdict,
  metrics,
  tableTitle,
  tableHeaders,
  tableRows,
  footerNote = DEFAULT_FOOTER_NOTE,
}: PrintableReportProps) {
  return (
    <div className="print-report">
      <div className="max-w-3xl mx-auto p-8 text-black">
        <h1 className="text-2xl font-bold">{title}</h1>
        {address && <p className="text-sm text-gray-600 mt-1">{address}</p>}
        <p className="text-xs text-gray-400 mt-1">
          Generated {new Date().toLocaleDateString()} — Investment Property Analyzer
        </p>

        {verdict && (
          <div className="border border-gray-300 rounded p-4 mt-4">
            <h2 className="font-bold text-lg">
              {verdict.label} — Score {verdict.score}/100
            </h2>
            <p className="text-sm mt-1">{verdict.summary}</p>
            <ul className="mt-3 text-sm space-y-1">
              {verdict.criteria.map((c) => (
                <li key={c.label}>
                  {c.pass ? "✓" : "✗"} <strong>{c.label}</strong> — {c.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          {metrics.map((m) => (
            <div key={m.label} className="border border-gray-300 rounded p-2">
              <div className="text-xs text-gray-500">{m.label}</div>
              <div className="font-bold">{m.value}</div>
            </div>
          ))}
        </div>

        {tableHeaders && tableRows && tableRows.length > 0 && (
          <div className="mt-4">
            {tableTitle && <h3 className="font-semibold text-sm mb-1">{tableTitle}</h3>}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {tableHeaders.map((h) => (
                    <th key={h} className="border-b border-gray-300 text-left p-1">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-gray-200 p-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">{footerNote}</p>
      </div>
    </div>
  );
}
