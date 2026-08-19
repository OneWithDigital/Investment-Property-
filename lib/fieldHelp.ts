/**
 * "What is this, and why does it matter?" content for InfoHint, keyed
 * once and reused across calculators — most of these fields (down
 * payment, vacancy, capex, etc.) mean the exact same thing on every
 * property type, so the explanation shouldn't be retyped five times and
 * drift out of sync. Property-type-specific fields (ADR, lease
 * structure reimbursement, etc.) get their own keys.
 */
export interface FieldHelpEntry {
  title: string;
  body: string;
}

export const FIELD_HELP = {
  purchasePrice: {
    title: "Purchase price",
    body: "What you're paying for the property, before closing costs or rehab. Everything else on this form is measured against this number.",
  },
  downPayment: {
    title: "Down payment",
    body: "The share of the purchase price you pay in cash instead of financing. Investment (non-owner-occupied) loans typically require 20–25% down; owner-occupant financing can go as low as 3.5–5%.",
  },
  interestRate: {
    title: "Interest rate",
    body: "The annual rate on the loan. Even small differences compound a lot over a 30-year amortization — get a real rate quote rather than a rough guess before relying on the verdict.",
  },
  loanTerm: {
    title: "Loan term",
    body: "How many years the loan is scheduled to fully pay off (amortize). A 30-year term means smaller monthly payments than a 15-year term, at the cost of more interest paid overall.",
  },
  closingCosts: {
    title: "Closing costs",
    body: "Lender fees, title insurance, escrow, recording fees, and similar one-time costs to close the purchase. Typically runs 2–5% of the purchase price — get a loan estimate from your lender rather than guessing.",
  },
  loanPoints: {
    title: "Loan points",
    body: "An upfront fee paid to the lender at closing, quoted as a % of the loan amount (1 point = 1% of the loan). Separate from closing costs above — some lenders quote them together, some separately. Leave at 0 unless your loan estimate actually shows a points/origination charge; this doesn't lower your rate here, it's just an added cash-to-close cost.",
  },
  pmi: {
    title: "PMI (Private Mortgage Insurance)",
    body: "Only relevant on conventional loans with less than 20% down — lenders require it to protect themselves against the higher default risk. Enter the annual rate as a % of the loan amount (commonly 0.3%–1.5%, ask your lender for the actual quote); it's automatically ignored if your down payment is 20%+. It also automatically stops being charged in the projection once your loan balance falls to 80% of the original purchase price, matching federal law (the Homeowners Protection Act) — you don't have to do anything to make that happen.",
  },
  rehabCost: {
    title: "Rehab / repair budget",
    body: "One-time money spent getting the property rent-ready or fixing deferred maintenance before/at move-in. This adds to your total cash needed to close, but isn't an ongoing expense.",
  },
  monthlyRent: {
    title: "Monthly rent",
    body: "The rent you expect to actually collect, not a hopeful number. Use real comps (the MLS/comps lookup pulls actual nearby rental listings) rather than a Zestimate-style guess — rent estimates can be off 10–20%.",
  },
  otherMonthlyIncome: {
    title: "Other monthly income",
    body: "Any income beyond base rent — laundry machines, parking, storage, pet fees, etc. Leave at 0 if none applies; don't pad this to make a marginal deal look better.",
  },
  propertyTax: {
    title: "Property tax",
    body: "Annual property tax bill. Check the county assessor's site for the actual current amount — and note that many counties reassess at the new purchase price, so the previous owner's tax bill can understate yours.",
  },
  insurance: {
    title: "Insurance",
    body: "Annual landlord/hazard insurance premium. Get a real quote before trusting this number — in flood-, wildfire-, or hurricane-exposed areas, insurance can run 2–4x a naive assumption and single-handedly break a deal.",
  },
  hoa: {
    title: "HOA",
    body: "Monthly homeowners association dues, if any. Also check for pending special assessments — those show up as a surprise one-time cost, not in this recurring number.",
  },
  ownerPaidUtilities: {
    title: "Owner-paid utilities",
    body: "Any utilities you (the owner) pay rather than passing through to the tenant — common in multifamily properties with shared meters. Leave at 0 if the tenant pays all utilities directly.",
  },
  maintenancePercent: {
    title: "Maintenance reserve",
    body: "A monthly set-aside for routine repairs and upkeep — a leaky faucet, a broken door, general wear and tear. Different from CapEx reserve below, which covers big, infrequent replacements. A common starting assumption is 5–10% of rent.",
  },
  capExPercent: {
    title: "CapEx reserve",
    body: "A monthly set-aside for big, infrequent capital replacements — roof, HVAC, water heater, appliances. This is what keeps a surprise $8,000 roof from wiping out a year of cash flow. Older properties or older major systems warrant a higher reserve.",
  },
  vacancyPercent: {
    title: "Vacancy",
    body: "The share of potential rent you expect to lose to vacancy between tenants, averaged over the year. 5–8% is a common assumption for stable markets; check local turnover trends rather than defaulting to 0%, which assumes the unit is never empty.",
  },
  managementPercent: {
    title: "Property management",
    body: "What a property manager charges, as a % of rent — typically 8–10% if you use one. Set to 0 if you're self-managing, but be honest with yourself about whether your time is really free.",
  },
  rentGrowth: {
    title: "Rent growth",
    body: "Assumed annual rent increase, used to project future years' cash flow. 2–3%/yr roughly tracks long-run inflation; pushing this higher makes the projection look better but isn't guaranteed.",
  },
  expenseGrowth: {
    title: "Expense growth",
    body: "Assumed annual increase in operating expenses (taxes, insurance, maintenance). Insurance and property tax have been rising faster than general inflation in many markets recently — don't automatically assume this matches rent growth.",
  },
  appreciation: {
    title: "Appreciation",
    body: "Assumed annual increase in the property's value, used to project your equity and exit proceeds. This is the most speculative assumption on the form — a good deal should still cash flow acceptably even at 0% appreciation.",
  },
  sellingCosts: {
    title: "Selling costs",
    body: "Realtor commission, closing costs, and similar costs you'll pay when you eventually sell. Typically 6–8% of the sale price — this reduces your net proceeds at exit.",
  },
  holdPeriod: {
    title: "Hold period",
    body: "How many years you plan to own the property before selling. Drives the length of the projection table and the exit-year numbers (net sale proceeds, IRR, equity multiple).",
  },
  comparableMarketRent: {
    title: "Comparable market rent for your unit",
    body: "What you'd pay to rent a similar unit elsewhere in the area. Used to calculate how much you're actually saving by living in one unit instead of renting nearby — not used in the property's own income calculation.",
  },
  marketCapRate: {
    title: "Market cap rate",
    body: "The going cap rate for similar properties in this market — not this specific deal's cap rate. Used to back into an \"implied value\" (NOI ÷ market cap rate) so you can compare it against the purchase price. Ask a local commercial broker or check recent comparable sales for this number; it varies a lot by market and asset class.",
  },
  exitCapRate: {
    title: "Exit cap rate",
    body: "The cap rate assumed when valuing the property at sale, used to project your exit proceeds. Conservative underwriting often assumes this is slightly higher (worse) than today's market cap rate, since cap rates tend to drift upward over a long hold.",
  },
  amortizationYears: {
    title: "Amortization",
    body: "The payment schedule the loan is calculated on — e.g., a 25-year amortization sets your monthly payment as if the loan pays off in 25 years, even if the loan itself matures sooner (see Loan term below).",
  },
  loanTermCommercial: {
    title: "Loan term",
    body: "How long until the loan actually comes due (matures) and has to be paid off or refinanced — often shorter than the amortization schedule on commercial/multifamily loans. If this is shorter than your hold period, you'll face a balloon payment before you planned to sell.",
  },
  economicVacancy: {
    title: "Economic vacancy",
    body: "Combines physical vacancy, rent concessions, and bad debt (rent billed but never collected) into one loss factor against gross potential rent — broader than just \"unit sits empty.\" 5–10% is a common range depending on the market and property class.",
  },
  capExReservePerUnit: {
    title: "CapEx reserve per unit",
    body: "An annual capital-replacement set-aside expressed per door rather than as a % of rent — the standard way multifamily underwriting budgets for roofs, parking lots, and major system replacements across a whole property.",
  },
  payroll: {
    title: "Payroll",
    body: "Wages for onsite staff (leasing, maintenance, super) if the property is large enough to need them. Leave at 0 for smaller properties that don't have dedicated staff.",
  },
  reimbursementPercent: {
    title: "Tenant reimbursement",
    body: "What share of taxes, insurance, and common-area-maintenance (CAM) costs your tenants reimburse you for, based on the lease structure you selected. NNN leases push most of this to tenants (near 100%); full-service leases push none of it (0%) — the field auto-fills a typical starting value when you change lease structure, but check actual lease terms.",
  },
  averageDailyRate: {
    title: "Average daily rate (ADR)",
    body: "The average nightly price across the whole year, blending peak-season and off-season pricing. Pull this from comparable listings on AirDNA, Mashvisor, or the Airbnb/VRBO app itself for the specific market — a generic guess here drives every revenue number downstream.",
  },
  occupancyPercent: {
    title: "Occupancy",
    body: "The share of nights booked over the year, averaged across seasons. STR occupancy varies a lot by market and season — 50–65% is a common blended range, but check comparable listings rather than assuming.",
  },
  cleaningFeeCharged: {
    title: "Cleaning fee charged",
    body: "What you charge the guest per stay for cleaning — this is revenue, separate from what cleaning actually costs you (see Cleaning cost).",
  },
  cleaningCost: {
    title: "Cleaning cost",
    body: "What you actually pay a cleaner per turnover. If this is close to or higher than the cleaning fee you charge, cleaning turnover is eating your margin rather than being a pass-through.",
  },
  strManagementPercent: {
    title: "Co-host / management",
    body: "What a co-host or STR property manager charges, usually as a % of booking revenue (often higher than long-term rental management fees, given the extra turnover work). Set to 0 if self-managing.",
  },
  comparableLongTermRent: {
    title: "Comparable long-term rent",
    body: "What this property would rent for as a standard long-term lease instead of a short-term rental. Used only to show the STR-vs-long-term-rental premium — it doesn't affect the STR income calculation itself.",
  },
  platformFee: {
    title: "Platform fee",
    body: "What Airbnb/VRBO/the booking platform takes as a percentage of booking revenue — typically around 3% on the host side, though it varies by platform and pricing model.",
  },
  camCost: {
    title: "CAM",
    body: "Common Area Maintenance — what you (the landlord) actually spend on shared-space upkeep (parking lot, lobby, landscaping, exterior). What tenants reimburse you for this is set separately by the Tenant reimbursement % above.",
  },
  creditLoss: {
    title: "Credit loss",
    body: "Rent billed but never collected — a tenant defaults, goes bankrupt, or simply doesn't pay. Distinct from vacancy (an empty space); this is occupied space that isn't actually paying.",
  },
} satisfies Record<string, FieldHelpEntry>;

/**
 * Same idea as FIELD_HELP, but for results/metric cards instead of
 * inputs — the headline numbers a first-time user has to reverse-engineer
 * from context otherwise, and the ones an experienced investor checks
 * first. Kept as a separate export since these explain a computed
 * output, not something you type in.
 */
export const RESULT_HELP = {
  capRate: {
    title: "Cap rate",
    body: "Net operating income ÷ purchase price, ignoring financing entirely — the return if you bought the property in cash. Higher isn't automatically better: a high cap rate often signals higher perceived risk or a slower-growth market, not a better deal. 6%+ is a common single-family/duplex screening bar; commercial and multifamily cap rates vary a lot by market and asset class.",
  },
  cashOnCash: {
    title: "Cash-on-cash return",
    body: "Annual pre-tax cash flow ÷ total cash invested (down payment + closing costs + rehab). Unlike cap rate, this reflects your actual leveraged return — what you're earning on the cash you put in, not on the full purchase price. 8%+ is a common long-term-rental screening bar; short-term rentals are held to a higher bar (12%+) given the added operational effort and risk.",
  },
  dscr: {
    title: "DSCR (Debt Service Coverage Ratio)",
    body: "Net operating income ÷ annual mortgage payment — how many times over the property's income covers its own debt payment. Lenders typically require at least 1.20–1.25 to originate a loan; below 1.0 means the property doesn't generate enough income to cover its own mortgage, before you even take a draw.",
  },
  grossRentMultiplier: {
    title: "Gross rent multiplier (GRM)",
    body: "Purchase price ÷ annual gross rent. A fast, rough screening tool — lower means you're paying less per dollar of rent — but it completely ignores expenses, so it's a first-pass filter, not a substitute for cap rate or actual cash flow.",
  },
  breakEvenRatio: {
    title: "Break-even ratio",
    body: "(Operating expenses + debt service) ÷ gross income — how much of your income cushion you have before the property stops covering its own bills. Lower is safer; many lenders like to see this at 85% or below.",
  },
  irr: {
    title: "IRR (Internal Rate of Return)",
    body: "The annualized return accounting for the size and timing of every cash flow — each year's cash flow plus the lump sum at sale — not just a simple average. It's the most complete single number for comparing this deal against your other investment options, but it's only as reliable as the growth and exit assumptions feeding it.",
  },
  equityMultiple: {
    title: "Equity multiple",
    body: "Total cash returned (all cash flow plus net sale proceeds) ÷ total cash invested. A 2.0x means you got back double what you put in over the hold period. Useful alongside IRR, since IRR alone shows the rate of return but not the absolute dollar scale.",
  },
  netSaleProceeds: {
    title: "Net sale proceeds",
    body: "What actually lands in your pocket at sale: the projected sale price, minus paying off the remaining loan balance, minus selling costs (commission, closing costs).",
  },
  impliedValue: {
    title: "Implied value (at market cap rate)",
    body: "Net operating income ÷ the market cap rate you entered. This is the income-approach valuation appraisers and lenders actually use for income property — compare it to the purchase price to see whether you're paying above or below what the property's income alone would justify.",
  },
  expenseRatio: {
    title: "Expense ratio",
    body: "Total operating expenses ÷ effective gross income — what share of every income dollar goes to running the property before debt service. Lower generally means more efficient operations, but an unusually low ratio can also be a red flag for under-budgeted maintenance or CapEx.",
  },
  pricePerUnit: {
    title: "Price per unit",
    body: "Purchase price ÷ number of units — the standard way multifamily deals get compared against other multifamily deals, independent of unit size or mix.",
  },
  pricePerSqft: {
    title: "Price / sqft",
    body: "Purchase price ÷ building square footage — the standard way commercial deals get compared against other listings in the same market.",
  },
  walt: {
    title: "WALT (Weighted Average Lease Term)",
    body: "The average remaining lease term across all tenants, weighted by how much rent each one contributes. A low WALT means a meaningful share of your rent roll could turn over soon — rollover risk if re-leasing takes time, requires concessions, or a leasing commission.",
  },
  commercialOccupancy: {
    title: "Occupancy",
    body: "Leased square footage ÷ total building square footage. Different from residential vacancy % — this is about how much space is under lease, not how many units are physically filled.",
  },
  revenuePerAvailableNight: {
    title: "RevPAN (Revenue per available night)",
    body: "Gross booking revenue ÷ total nights available in the year. The short-term-rental industry's standard way to compare listings apples-to-apples regardless of pricing strategy — a high-ADR/low-occupancy listing and a low-ADR/high-occupancy listing can land at the same RevPAN.",
  },
  grossBookingRevenue: {
    title: "Gross booking revenue",
    body: "Total revenue collected from guests across the year, before platform fees, cleaning costs, or any other expenses are subtracted.",
  },
  effectiveHousingCost: {
    title: "Effective housing cost",
    body: "What you actually pay out of pocket each month to live in your unit, after subtracting the rent your tenants pay from your total mortgage and expenses. Can go negative — meaning tenants are covering more than your full housing cost.",
  },
  breakEvenOccupancy: {
    title: "Break-even occupancy",
    body: "The minimum occupancy rate needed for booking revenue to cover all expenses and debt service — below this, the property loses money. The bigger the gap between this and your assumed occupancy, the more cushion you have if bookings come in softer than expected.",
  },
} satisfies Record<string, FieldHelpEntry>;
