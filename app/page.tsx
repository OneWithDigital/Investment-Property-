import Link from "next/link";

/* ---------- Hand-authored illustrations ---------- */

function DealPathHero() {
  const nodes = [
    { x: 40, y: 200, label: "Address" },
    { x: 180, y: 110, label: "Comps" },
    { x: 340, y: 170, label: "Numbers" },
    { x: 500, y: 90, label: "Verdict" },
  ];
  const d = `M${nodes.map((n) => `${n.x},${n.y}`).join(" L")}`;
  return (
    <svg viewBox="0 0 560 250" className="w-full" role="img" aria-label="A path from an address to comps, the numbers, and a buy/pass verdict">
      <path d={d} fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="1 14" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#0f172a" strokeWidth="1.5" opacity="0.15" />
      {nodes.map((n, i) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={i === nodes.length - 1 ? 12 : 8} fill={i === nodes.length - 1 ? "#059669" : "#0f172a"} />
          <circle cx={n.x} cy={n.y} r={i === nodes.length - 1 ? 12 : 8} fill="none" stroke="#f8fafc" strokeWidth="2" />
          <text
            x={n.x}
            y={n.y - 22}
            textAnchor="middle"
            className="fill-slate-900"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function IconMagnifyHouse() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 20V9l9-6 9 6v6" />
      <path d="M12 20v-6h10v6" />
      <circle cx="27" cy="27" r="7" />
      <path d="M32 32l5 5" />
    </svg>
  );
}

function IconGauge() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 26a14 14 0 0128 0" />
      <path d="M20 26L28 15" />
      <circle cx="20" cy="26" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconStack() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L6 13l14 7 14-7-14-7z" />
      <path d="M6 20l14 7 14-7" />
      <path d="M6 27l14 7 14-7" />
    </svg>
  );
}

function IconFork() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 34V20M20 20C10 20 8 8 8 8M20 20c10 0 12-12 12-12" />
      <circle cx="8" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="32" cy="6" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---------- Content ---------- */

const PROBLEMS = [
  {
    icon: IconMagnifyHouse,
    title: "Every listing 'looks' good until you run it",
    body: "A Zillow screenshot and a gut feeling aren't underwriting. Vacancy, capex reserves, and financing terms all move the answer — and most of that math never happens before an offer goes in.",
  },
  {
    icon: IconGauge,
    title: "You've got instinct. You don't have benchmarks.",
    body: "Is 6% cap rate good for a duplex? Is 9% cash-on-cash enough for a short-term rental, given the extra risk? Every property type has a different bar, and guessing which one applies isn't a strategy.",
  },
  {
    icon: IconStack,
    title: "You shouldn't need a $500/mo platform to know if it pencils",
    body: "The math is well-established — cap rate, cash-on-cash, DSCR, the 1% rule. It doesn't require an enterprise subscription, just a tool that runs it correctly for the property type you're actually looking at.",
  },
];

const GUIDE_PROOF = [
  {
    title: "Five calculators, not one formula reskinned",
    body: "Single-family, duplex, multi-unit (5+), commercial, and short-term rental each get their own input model and verdict benchmarks — a duplex house-hack and a 20-unit income property aren't underwritten the same way.",
  },
  {
    title: "Real comps, not a scraped guess",
    body: "MLS-style value and rent comps pull from the RentCast API — actual nearby sales and rental listings, with the comparables shown so you can sanity-check the estimate yourself.",
  },
  {
    title: "Benchmarks that reflect real risk",
    body: "A short-term rental needs a higher cash-on-cash return (12%+) than a long-term rental (8%+) to clear the bar — because the operational effort and regulatory exposure are genuinely different, not because of an arbitrary house rule.",
  },
];

const PLAN_STEPS = [
  {
    step: "1",
    title: "Pick your property type",
    body: "Single-family, duplex, multi-unit, commercial, or short-term rental — each with a calculator built for how that deal actually gets underwritten.",
  },
  {
    step: "2",
    title: "Pull comps, run the numbers",
    body: "Paste an address for RentCast comps, fill in what you know, and get cap rate, cash-on-cash return, DSCR, the 1%/50% rules, and a buy/pass verdict.",
  },
  {
    step: "3",
    title: "Save it, compare it, print it",
    body: "Every analysis saves to your portfolio, rankable by whatever metric matters to you, with a printable report for the ones you're serious about.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              IP
            </div>
            <span className="text-sm font-bold text-slate-900">Investment Property Analyzer</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-24 py-14 sm:py-20">
          {/* HERO */}
          <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                For real estate investors — free account, no credit card
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.08] text-slate-900 sm:text-5xl">
                Don&apos;t guess if a deal pencils out. Run the numbers.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-[17px]">
                Cap rate, cash-on-cash return, DSCR, and a buy/pass verdict — for single-family,
                duplex, multi-unit, commercial, and short-term rental deals. Pull comps, save every
                analysis, and compare deals side by side before you ever write an offer.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  Start free — no credit card
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-white"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Takes about a minute. Already have an account?{" "}
                <Link href="/login" className="font-medium text-slate-600 underline underline-offset-2">
                  Log in
                </Link>
                .
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <DealPathHero />
            </div>
          </section>

          {/* PROBLEM */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">The problem</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Analyzing a deal shouldn&apos;t feel like this.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {PROBLEMS.map((p) => (
                <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-emerald-700">
                    <p.icon />
                  </div>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* GUIDE / AUTHORITY */}
          <section id="how-it-works" className="rounded-2xl bg-slate-900 px-6 py-10 text-slate-50 sm:px-10 sm:py-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-400">How it works</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Built for how deals actually get underwritten — not a single spreadsheet formula
                wearing five different labels.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                A duplex house-hack, a 20-unit apartment building, and a short-term rental don&apos;t
                get evaluated the same way — so they don&apos;t share a calculator here either.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {GUIDE_PROOF.map((g) => (
                <div key={g.title} className="rounded-xl border border-white/15 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">{g.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{g.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PLAN */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">The plan</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Three steps. Everything else is detail.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {PLAN_STEPS.map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">The payoff</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    A clear buy/pass verdict, not just a wall of numbers
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Every calculator scores the deal against benchmarks built for that property
                    type and gives you a straight answer — Strong Buy, Good Investment, Marginal, or
                    Pass — plus the full metric breakdown behind it.
                  </p>
                  <Link
                    href="/signup"
                    className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                  >
                    Sign up to run your first deal →
                  </Link>
                </div>
                <div className="rounded-xl border border-slate-200 bg-paper p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Preview</p>
                  <div className="mt-3 space-y-3">
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Strong Buy
                    </span>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Cap rate</p>
                        <p className="text-sm font-bold text-slate-900">7.2%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Cash-on-cash</p>
                        <p className="text-sm font-bold text-slate-900">11.4%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">DSCR</p>
                        <p className="text-sm font-bold text-slate-900">1.38</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Cash flow</p>
                        <p className="text-sm font-bold text-slate-900">$412/mo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTRAST */}
          <section>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">Without running the numbers</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                  <li>· Offer on a deal that looked fine until the vacancy assumption changed</li>
                  <li>· Find out the DSCR doesn&apos;t clear your lender&apos;s bar after you&apos;re under contract</li>
                  <li>· Compare deals from memory instead of side by side</li>
                  <li>· No record of what you actually assumed when you made the call</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">With Investment Property Analyzer</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                  <li>· A verdict built on the benchmarks that actually apply to that property type</li>
                  <li>· Comps pulled before you rely on a guess</li>
                  <li>· Every saved analysis ranked and compared in one portfolio view</li>
                  <li>· A printable report you can hand to a lender or a partner</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-center text-amber-600">
              <IconFork />
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="rounded-2xl bg-slate-900 px-6 py-12 text-center sm:px-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Create your free account and see if your next deal pencils out.
            </h2>
            <p className="mt-2 text-sm text-slate-400">No credit card, no catch — just an email and a password.</p>
            <div className="mt-7">
              <Link
                href="/signup"
                className="inline-block rounded-lg bg-emerald-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Start free — no credit card
              </Link>
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
          <p>Investment Property Analyzer — built by One With Digital.</p>
        </footer>
      </div>
    </div>
  );
}
