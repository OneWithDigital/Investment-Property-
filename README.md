# Investment Property Analyzer

A multi-user web app for analyzing investment properties across five
property types — Single-Family, Duplex/Small Multifamily, Multi-Unit
(5+), Commercial, and Short-Term Rental — each with its own calculators
and buy/pass verdict, plus a Grants & Funding finder for financing new
builds, remodels, and energy-efficiency work. Sign in, pick a tab, paste
a Zillow URL or address (or search MLS comps), fill in the numbers, and
get a full breakdown. Save analyses to build a portfolio, compare deals
side by side, and print/export a report for each one.

## Getting started

```bash
npm install
cp .env.example .env   # fill in real values, especially NEXTAUTH_SECRET
npx prisma migrate dev # creates the database schema (needs a running Postgres)
npm run dev
```

Then open http://localhost:3000, sign up for an account, and log in.

Requires a Postgres database — see `.env.example` for local setup options
(a local install, Docker, or a free hosted instance like Neon/Supabase).

## Running tests

```bash
npm test
```

Unit tests cover the shared mortgage/amortization/IRR math
(`__tests__/calculations.test.ts`) and each property-type calculator
(`__tests__/calc-multi-property.test.ts`) against hand-computed reference
scenarios — including a derived break-even-occupancy formula for the STR
calculator. `.github/workflows/ci.yml` runs the full test + build pipeline
on every push and PR.

## How it works

### Auth
Full multi-user accounts via NextAuth (credentials provider, JWT
sessions) backed by a Prisma + Postgres `User` table (`bcryptjs` password
hashing). `middleware.ts` gates every route except `/login`, `/signup`,
`/verify-email`, `/forgot-password`, `/reset-password`, and the NextAuth
API routes — those last three must stay reachable while logged out, since
that's precisely how a locked-out user regains access.

- **Email verification**: signup sends a verification link
  (`lib/authEmails.ts` + `lib/tokens.ts`); a banner reminds unverified
  users with a resend option. Login is never blocked on verification
  status, so a misconfigured/unset email provider can't lock anyone out.
- **Password reset**: `/forgot-password` → emailed link → `/reset-password`,
  with single-use, time-limited tokens (1 hour) and no account-enumeration
  leak (the endpoint always responds success).
- **Email delivery** (`lib/email.ts`): sends real mail via SMTP when
  `SMTP_HOST` is configured; otherwise logs the message (including the
  verification/reset link) to the server console — the same
  graceful-degradation pattern used for Zillow/RentCast. Dev/test works
  end-to-end with zero email setup.
- **Rate limiting** (`lib/rateLimit.ts`): basic in-memory limiter on
  signup, login, password reset, and resend-verification. It's
  single-process (documented in the file) — swap in a shared store
  (Redis/Upstash) if you deploy multiple instances.

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

### Saved analyses, portfolio, and reports
- **Save** any analysis from any calculator tab (`SavedAnalysis` Prisma
  model, stores inputs/result/verdict as JSON since the five property
  types have genuinely different shapes).
- **Saved tab** — history of everything you've saved; click one to reload
  it back into its calculator, rename, or delete.
- **Portfolio tab** — every saved analysis ranked by whichever metric you
  choose (cap rate, cash-on-cash, cash flow, DSCR), with checkboxes to
  pull 2+ into a side-by-side comparison table.
- **Print / Save PDF** — every result view includes a printable report
  (`components/PrintableReport.tsx`) that renders via the browser's own
  print engine (`window.print()` + print-only CSS in `globals.css`)
  rather than a server-side PDF renderer — no extra runtime dependency,
  works in any deploy environment.

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
  covering the residential tabs (Single-Family, Duplex, STR), including
  an expandable list of the actual comparable sales/rentals RentCast used
  to derive its estimate. Degrades gracefully with a clear message if
  `RENTCAST_API_KEY` isn't configured — see `.env.example`.
- **Location factors** (`lib/locationFactors.ts`) — state-by-state
  landlord/tenant regulatory climate (rent control, eviction speed) plus
  a due-diligence checklist covering schools, crime, job growth, flood
  risk, and more.

## Known limitations / follow-ups

- Next.js is pinned to the 14.x line (`14.2.35`, latest patched release
  on that major) and Prisma to the stable 5.x line (Prisma 7 requires a
  driver-adapter config rewrite). Both are deliberate choices for
  stability, not oversights — revisit if you want the latest major.
- The rate limiter is in-memory/single-process — fine for one instance,
  not sufficient for a horizontally-scaled deployment (see `lib/rateLimit.ts`).
- MLS/comps coverage (RentCast) is residential-only; Multi-Unit and
  Commercial tabs don't have a comparable self-serve comps API, so those
  stay manual-entry.
- The state-level landlord/tenant data is a high-level starting point,
  not legal advice — many rent-control and tenant-protection rules are
  city-level, not state-level.
- Rent/price/tax data from Zillow or RentCast should always be
  spot-checked against the live listing/market before trusting the
  analysis.
- `.npmrc` sets `legacy-peer-deps=true` — required because next-auth@4's
  optional (unused) EmailProvider peer-depends on an old, CVE-affected
  nodemailer range; this app's own email sending uses a patched version
  instead. See the comment in `.npmrc` for the full explanation.
