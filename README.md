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

### Landing page and auth
`/` (`app/page.tsx`) is a public marketing page — no session required —
that pitches the tool and sends visitors to `/signup` or `/login`. The
actual app lives at `/dashboard`, kept as a separate route specifically
so a logged-out visitor lands on a sales pitch instead of getting bounced
straight to a login form. `middleware.ts` reflects that split: it gates
every route except `/` itself, `/login`, `/signup`, `/verify-email`,
`/forgot-password`, `/reset-password`, and the NextAuth API routes — the
last three must stay reachable while logged out, since that's precisely
how a locked-out user regains access.

Full multi-user accounts via NextAuth (credentials provider, JWT
sessions) backed by a Prisma + Postgres `User` table (`bcryptjs` password
hashing).

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
- **Bot hardening on signup** (`lib/botCheck.ts`): now that `/signup` is
  reachable from a public landing page rather than sitting behind a login
  wall, it's a more exposed spam target. A hidden honeypot field
  (`components/HoneypotField.tsx`) plus a minimum form-fill-time check
  catch unsophisticated scripted signups without a captcha; combined with
  the existing per-IP rate limit above.

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

**Field-level help** (`components/InfoHint.tsx` + `lib/fieldHelp.ts`) —
a click-to-reveal "?" next to a field's label explaining what it is and
why it matters (typical ranges, where to find a real number instead of
guessing, how it differs from an easily-confused neighbor like
maintenance vs. CapEx reserve). Content is keyed once in `lib/fieldHelp.ts`
and reused across calculators for fields that mean the same thing
everywhere (down payment, vacancy, closing costs, etc.), with
property-type-specific entries (ADR, tenant reimbursement %, economic
vacancy) added per calculator. Deliberately not applied to every single
field — self-explanatory ones (building sqft, avg nights/stay) don't get
a box, since annotating everything would bury the fields that actually
need it. The same `InfoHint` component is reused on `MetricCard` (via a
second `RESULT_HELP` export) for the headline results-page numbers —
cap rate, cash-on-cash return, DSCR, IRR, equity multiple, WALT, RevPAN,
and the other type-specific metrics — since those are exactly the terms
a first-time user has to reverse-engineer from the verdict otherwise.

**Stress-test scenarios** (`lib/sensitivity.ts` + `components/ScenarioToggle.tsx`) —
a Downside / Base case / Upside toggle on every results page that shifts
rent (±5%), vacancy (+3/-2 points, or occupancy for STR since it moves
the opposite direction), and interest rate (+1 point on the downside
only) and instantly recomputes the full result and verdict. Recomputes
entirely client-side — `analyzeProperty`/`evaluateVerdict` and their
per-type equivalents are pure functions with no server or DB dependency,
so switching scenarios is instant with no network round trip, and the
original submitted numbers are never mutated (switching back to "Base
case" always returns exactly what you entered). Printing while a
non-base scenario is selected labels the report with which scenario
it reflects, so a printed downside case can't be mistaken for the
as-entered numbers.

**Loan points** — an optional `loanPointsPercent` field on every
calculator's Purchase & Financing section, alongside closing costs. Adds
`loanAmount × points%` to cash needed to close as its own line item
(`loanPointsCost`), separate from closing costs since lenders often quote
them separately on a loan estimate. Points are a one-time cost, so they
affect cash-to-close and cash-on-cash return but not monthly cash flow or
DSCR — this tool doesn't model buying down the rate with points, only the
upfront fee.

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

### Admin section
A `role` field (`USER` / `ADMIN`) on `User` gates `/admin` — enforced in
`middleware.ts` (redirects non-admins before the page even renders) and
again server-side in every `/api/admin/*` route (`lib/adminAuth.ts`),
since middleware alone is routing-layer defense, not something a route
handler should assume ran correctly.

- **Bootstrapping the first admin**: there's no UI for this (nothing can
  create the first admin from inside a system that requires an admin to
  use it). Instead, list trusted emails in `ADMIN_EMAILS` — a
  comma-separated env var. Anyone signing in with a matching email is
  promoted to `ADMIN` in the database on that login. After that, the DB
  role is the source of truth; promote/demote other users from the admin
  Users page. See `.env.example`.
- **Users** (`/admin/users`) — list all accounts, promote/revoke admin,
  disable/enable (blocks login without deleting their data), or delete
  outright (cascades to their saved analyses). An admin can't change their
  own role/disabled state or delete themselves from this panel — that's a
  self-lockout footgun with no one else around to undo it.
- **Analyses** (`/admin/analyses`) — every saved analysis across every
  user, searchable by label/address/owner email. Read-only.
- **Settings** (`/admin/settings`) — a small `AppSetting` key/value table
  for non-secret, DB-editable toggles (currently just "allow new
  signups"). **API keys and other secrets are deliberately not managed
  here** — they stay in env vars (see Overview tab for what's configured,
  `.env.example`/README for how to set them). A DB-backed secrets UI
  needs encryption-at-rest and audit logging to not be a downgrade from
  "SSH in and edit `.env`," which isn't worth it unless non-technical
  staff need to rotate keys without deploy access.
- **Monetization** (`/admin/monetization`) — CRUD for `AdPlacement`
  records (affiliate links / ads). `components/AdSlot.tsx` renders active
  placements for a given slot, fetched publicly via
  `GET /api/ad-placements?slot=`; one slot is wired into the app today —
  `app-footer`, mounted in `TabShell.tsx` so it appears at the bottom of
  every tab. New placements default to inactive, so nothing shows until
  you create one with slot `app-footer` and switch it on. Adding another
  slot elsewhere in the UI is a one-line `<AdSlot slot="..." />` plus
  picking that same string as the slot value in the admin form — no
  schema or API changes needed.

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
