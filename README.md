# Investment Property Analyzer

A multi-user web app for analyzing investment properties across five
property types — Single-Family, Duplex/Small Multifamily, Multi-Unit
(5+), Commercial, and Short-Term Rental — each with its own calculators
and buy/pass verdict, plus a Grants & Funding finder for financing new
builds, remodels, and energy-efficiency work. Sign in, pick a tab, paste
a Zillow URL or address (or search MLS comps), fill in the numbers, and
get a full breakdown.

## Getting started

```bash
npm install
cp .env.example .env   # fill in real values, especially NEXTAUTH_SECRET
npx prisma migrate dev # creates the local SQLite database
npm run dev
```

Then open http://localhost:3000, sign up for an account, and log in.

## Running tests

```bash
npm test
```

Unit tests cover the shared mortgage/amortization/IRR math
(`__tests__/calculations.test.ts`) and each property-type calculator
(`__tests__/calc-multi-property.test.ts`) against hand-computed reference
scenarios — including a derived break-even-occupancy formula for the STR
calculator.

## How it works

### Auth
Full multi-user accounts via NextAuth (credentials provider, JWT
sessions) backed by a Prisma + SQLite `User` table (`bcryptjs` password
hashing). `middleware.ts` gates every route except `/login`, `/signup`,
and the NextAuth API routes. For production, swap `DATABASE_URL` to a
real Postgres/MySQL instance — Prisma makes that a one-line change to
`prisma/schema.prisma`.

### The five calculators
Each property type has its own input model, calculation engine, and
verdict benchmarks under `lib/calc/` — they are not the same formula
with different labels:

- **Single-Family** (`lib/calculations.ts`, `lib/verdict.ts`) — standard
  buy-and-hold: cap rate, cash-on-cash, DSCR, the 1%/50% rules,
  appreciation-based projection.
- **Duplex / Small Multifamily** (`lib/calc/duplex.ts`) — per-unit rent
  roll with a house-hacking mode: owner-occupant financing, an
  "effective housing cost" metric (what you actually pay to live there
  after tenant rent), and a parallel "if fully rented" scenario for once
  you move out.
- **Multi-Unit (5+)** (`lib/calc/multiUnit.ts`) — valued by the income
  approach (NOI ÷ cap rate) instead of comps, separate amortization vs.
  loan-maturity terms with balloon-risk flagging, per-unit CapEx
  reserves, and an implied-value-vs-purchase-price comparison against
  your market cap rate assumption.
- **Commercial** (`lib/calc/commercial.ts`) — lease-structure-aware
  (NNN / modified-gross / full-service-gross) with tenant reimbursement
  modeling, a multi-tenant rent roll, weighted average lease term (WALT)
  for rollover risk, and price/rent per square foot.
- **Short-Term Rental** (`lib/calc/shortTermRental.ts`) — ADR × occupancy
  revenue modeling, platform fees, cleaning turnover economics, an
  algebraically-derived break-even occupancy, an STR-regulation risk gate
  (a jurisdiction marked "banned" auto-fails the deal), and an STR-vs-LTR
  cash flow comparison.

All five funnel through a shared weighted-criteria scorer
(`lib/verdict/scoreCriteria.ts`) so the verdict UI behaves consistently,
but each supplies its own benchmarks — e.g. STR requires a higher
cash-on-cash return (12%+) than long-term rentals (8%+) to reflect the
added operational effort and regulatory exposure.

### Grants & Funding finder
`lib/grants.ts` is a curated reference of ~20 real federal (plus
representative state/local) programs — FHA 203(k), USDA rural repair
grants/loans, LIHTC, PACE financing, SBA 504, the historic rehab tax
credit, Opportunity Zones, energy-efficiency tax credits, and more —
filterable by property type and project type (new build, remodel,
energy efficiency, etc.). This is a research starting point, not a live
feed; program terms change and vary a lot by state/city, and deliberately
contains no external links (verify current details on each agency's own
site rather than trust a hardcoded URL).

### Property data lookups
- **Zillow** (`lib/zillow.ts`) — parses a Zillow URL into an address/zpid
  (no network call needed) and makes a best-effort server-side fetch of
  the public listing page. Zillow runs aggressive bot detection, so this
  **will frequently fail**, especially from cloud IPs — that's expected,
  not a bug. When it's blocked, the UI says so plainly and you fill in
  price/tax/rent from the listing yourself.
- **MLS/comps** (`lib/mlsLookup.ts`) — a real (non-scraping) comps and
  valuation lookup via the [RentCast API](https://www.rentcast.io/api),
  covering the residential tabs (Single-Family, Duplex, STR). Degrades
  gracefully with a clear message if `RENTCAST_API_KEY` isn't configured
  — see `.env.example`.
- **Location factors** (`lib/locationFactors.ts`) — state-by-state
  landlord/tenant regulatory climate (rent control, eviction speed) plus
  a due-diligence checklist covering schools, crime, job growth, flood
  risk, and more.

## Known limitations / follow-ups

- Next.js is pinned to the 14.x line (`14.2.35`, latest patched release
  on that major) and Prisma to the stable 5.x line (Prisma 7 requires a
  driver-adapter config rewrite). Both are deliberate choices for
  stability, not oversights — revisit if you want the latest major.
- MLS/comps coverage (RentCast) is residential-only; Multi-Unit and
  Commercial tabs don't have a comparable self-serve comps API, so those
  stay manual-entry.
- The state-level landlord/tenant data is a high-level starting point,
  not legal advice — many rent-control and tenant-protection rules are
  city-level, not state-level.
- Rent/price/tax data from Zillow or RentCast should always be
  spot-checked against the live listing/market before trusting the
  analysis.
