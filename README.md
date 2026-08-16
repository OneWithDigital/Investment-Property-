# Investment Property Analyzer

A web app that runs a full buy-and-hold rental analysis on a property:
paste a Zillow URL or an address, fill in the numbers, and get cash flow,
cap rate, cash-on-cash return, DSCR, the 1%/50% rules, a multi-year
projection with IRR, and a verdict grounded in standard investor
benchmarks — plus a location/regulatory due-diligence checklist.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Running tests

```bash
npm test
```

The calculation engine (`lib/calculations.ts`) has unit tests
(`__tests__/calculations.test.ts`) that check the mortgage payment formula
against known reference values, the amortization schedule, the IRR solver,
and cap rate / cash-on-cash / DSCR against hand-computed scenarios.

## How it works

- **`lib/calculations.ts`** — the calculation engine. Mortgage payment
  (P&I), monthly/annual NOI, cap rate, cash-on-cash return, DSCR, gross
  rent multiplier, the 1% and 50% rules, break-even ratio, debt yield, a
  year-by-year projection (rent growth, expense growth, appreciation,
  amortization), and an IRR solved via Newton's method over the resulting
  cash-flow series.
- **`lib/verdict.ts`** — scores the property against common buy-and-hold
  benchmarks (positive cash flow, ≥8% cash-on-cash, ≥6% cap rate, ≥1.25
  DSCR, the 1% rule, break-even ratio) and produces a Strong Buy / Good
  Investment / Marginal / Pass verdict with a breakdown of which criteria
  passed.
- **`lib/locationFactors.ts`** — a state-by-state landlord/tenant
  regulatory climate reference (rent control, eviction speed, etc.) plus a
  qualitative due-diligence checklist covering things the spreadsheet
  can't tell you: schools, crime, job/population growth, flood risk,
  short-term-rental restrictions, and more.
- **`lib/zillow.ts`** — parses a Zillow URL into an address/zpid and
  makes a best-effort server-side fetch of the public listing page.
- **`app/api/analyze`** — runs the calculation engine + verdict + location
  lookup for a given set of inputs.
- **`app/api/zillow`** — the Zillow lookup endpoint.

## A note on Zillow

Zillow runs aggressive bot detection (PerimeterX) in front of most of its
pages, so automated fetches of listing data **will frequently fail**,
especially from cloud/data-center IPs. That's expected, not a bug — this
tool is built around that reality:

- Pasting a Zillow URL always gets you a parsed address (from the URL
  slug itself, no network call needed) and a best-effort attempt to pull
  price/rent/tax data from the public page.
- When Zillow blocks the fetch, the UI tells you plainly and you fill in
  price, taxes, insurance, and rent estimate yourself from the listing —
  numbers you can read off the page in a few seconds. This is the
  reliable path, not a fallback of last resort.
- Nothing here bypasses CAPTCHAs, rotates IPs, or does bulk/automated
  scraping — it's a single best-effort fetch per user-initiated lookup.

## Known limitations / follow-ups

- Next.js is pinned to the 14.x line (`14.2.35`, latest patched release
  on that major). A few dependency advisories only get fully resolved by
  upgrading to Next 15/16, which is a breaking change left for a
  deliberate follow-up rather than done unprompted.
- Rent/price/tax data from Zillow (when it does come through) should
  always be spot-checked against the live listing before trusting the
  analysis — Zestimates and rent Zestimates can be materially off from
  real comps.
- The state-level landlord/tenant data in `lib/locationFactors.ts` is a
  high-level starting point for due diligence, not legal advice — many
  rent-control and tenant-protection rules are city-level, not
  state-level.
