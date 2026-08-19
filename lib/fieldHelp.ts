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
