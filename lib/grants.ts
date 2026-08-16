export type FundingLevel = "Federal" | "State/Local" | "Utility";
export type FundingType =
  | "Grant"
  | "Low-Interest Loan"
  | "Loan Insurance/Guarantee"
  | "Tax Credit"
  | "Tax Incentive"
  | "Financing Program";

export type PropertyTypeTag =
  | "single-family"
  | "duplex"
  | "multi-unit"
  | "commercial"
  | "short-term-rental"
  | "any";

export type ProjectTypeTag =
  | "acquisition"
  | "new-build"
  | "remodel-rehab"
  | "energy-efficiency"
  | "historic-preservation"
  | "affordable-housing-development"
  | "down-payment-assistance";

export interface FundingProgram {
  id: string;
  name: string;
  level: FundingLevel;
  agency: string;
  type: FundingType;
  propertyTypes: PropertyTypeTag[];
  projectTypes: ProjectTypeTag[];
  eligibility: string;
  description: string;
  typicalBenefit: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyTypeTag, string> = {
  "single-family": "Single-Family",
  duplex: "Duplex / Small Multifamily (2-4 units)",
  "multi-unit": "Multi-Unit (5+ units)",
  commercial: "Commercial",
  "short-term-rental": "Short-Term Rental",
  any: "Any property type",
};

export const PROJECT_TYPE_LABELS: Record<ProjectTypeTag, string> = {
  acquisition: "Acquisition / down payment",
  "new-build": "New construction",
  "remodel-rehab": "Remodel / rehab",
  "energy-efficiency": "Energy efficiency / electrification",
  "historic-preservation": "Historic preservation",
  "affordable-housing-development": "Affordable housing development",
  "down-payment-assistance": "Down payment assistance",
};

/**
 * A curated reference list of real, well-established federal (plus a
 * few representative state/local and utility) programs that fund
 * acquisition, new construction, remodeling, and energy-efficiency
 * work on investment property. This is NOT a live feed — program
 * details, funding levels, and availability change over time and vary
 * a lot by state/city, so treat this as a starting point for research,
 * not a guarantee of eligibility or current terms. Search the agency's
 * official site for the current, authoritative version of each program.
 */
export const FUNDING_PROGRAMS: FundingProgram[] = [
  {
    id: "fha-203k",
    name: "FHA 203(k) Rehabilitation Mortgage Insurance",
    level: "Federal",
    agency: "HUD / FHA",
    type: "Loan Insurance/Guarantee",
    propertyTypes: ["single-family", "duplex"],
    projectTypes: ["acquisition", "remodel-rehab"],
    eligibility:
      "Owner-occupants (1-4 unit properties, including house-hacking a duplex/triplex/fourplex). Standard 203(k) for major rehab, Limited 203(k) for smaller projects (up to ~$75k).",
    description:
      "Rolls the purchase price and renovation cost into a single FHA-insured mortgage, so you don't need separate acquisition and construction loans.",
    typicalBenefit: "As low as 3.5% down; renovation costs financed into the mortgage.",
  },
  {
    id: "fannie-homestyle",
    name: "Fannie Mae HomeStyle Renovation Loan",
    level: "Federal",
    agency: "Fannie Mae (via approved lenders)",
    type: "Financing Program",
    propertyTypes: ["single-family", "duplex", "multi-unit"],
    projectTypes: ["acquisition", "remodel-rehab"],
    eligibility:
      "Owner-occupants, second-home buyers, and investors (investor terms are less favorable than owner-occupant). Up to 4 units for residential; conventional loan limits apply.",
    description:
      "Conventional alternative to FHA 203(k) — combines purchase/refinance and renovation costs into one loan, with more flexibility on project scope (including investor use).",
    typicalBenefit: "Renovation budget up to 75% of as-completed value financed into one loan.",
  },
  {
    id: "freddie-choicerenovation",
    name: "Freddie Mac CHOICERenovation Loan",
    level: "Federal",
    agency: "Freddie Mac (via approved lenders)",
    type: "Financing Program",
    propertyTypes: ["single-family", "duplex"],
    projectTypes: ["acquisition", "remodel-rehab", "energy-efficiency"],
    eligibility: "Owner-occupants, second-home buyers, and investors; 1-4 unit properties.",
    description:
      "Freddie Mac's equivalent to HomeStyle — one loan covering purchase/refinance plus renovation, including resilience improvements (e.g. storm/flood hardening).",
    typicalBenefit: "Single-close financing for purchase + renovation, including disaster-resilience upgrades.",
  },
  {
    id: "usda-504-repair",
    name: "USDA Single Family Housing Repair Loans & Grants (Section 504)",
    level: "Federal",
    agency: "USDA Rural Development",
    type: "Grant",
    propertyTypes: ["single-family"],
    projectTypes: ["remodel-rehab", "energy-efficiency"],
    eligibility:
      "Very-low-income homeowners in eligible rural areas; grants limited to homeowners age 62+ for health/safety repairs.",
    description:
      "Direct loans and grants to repair, improve, or modernize homes, or remove health/safety hazards, in USDA-eligible rural areas.",
    typicalBenefit: "Loans up to $40,000; grants up to $10,000 (lifetime grant cap) for qualifying seniors.",
  },
  {
    id: "usda-rd-guaranteed",
    name: "USDA Rural Development Single Family Housing Guaranteed Loan",
    level: "Federal",
    agency: "USDA Rural Development",
    type: "Loan Insurance/Guarantee",
    propertyTypes: ["single-family"],
    projectTypes: ["acquisition"],
    eligibility: "Moderate-income buyers purchasing a primary residence in an eligible rural area.",
    description:
      "Zero-down-payment financing option for eligible rural/suburban properties — useful for a live-in-then-rent or house-hack strategy in qualifying areas.",
    typicalBenefit: "0% down payment, competitive fixed rates.",
  },
  {
    id: "usda-multifamily-515-538",
    name: "USDA Multi-Family Housing Programs (Sections 515 & 538)",
    level: "Federal",
    agency: "USDA Rural Development",
    type: "Loan Insurance/Guarantee",
    propertyTypes: ["multi-unit"],
    projectTypes: ["new-build", "remodel-rehab", "affordable-housing-development"],
    eligibility: "Developers/owners of affordable rental housing in eligible rural areas.",
    description:
      "Direct (515) and guaranteed (538) loan programs financing construction or rehab of affordable multi-family rental housing in rural communities.",
    typicalBenefit: "Below-market financing tied to income-restricted rents.",
  },
  {
    id: "hud-221d4",
    name: "HUD/FHA 221(d)(4) Multifamily New Construction & Substantial Rehab Insurance",
    level: "Federal",
    agency: "HUD / FHA",
    type: "Loan Insurance/Guarantee",
    propertyTypes: ["multi-unit"],
    projectTypes: ["new-build", "remodel-rehab"],
    eligibility: "For-profit and nonprofit developers of multifamily (5+ unit) properties.",
    description:
      "FHA-insured, non-recourse, long-term fixed-rate financing for new construction or substantial rehabilitation of apartment properties.",
    typicalBenefit: "High leverage (up to ~85% LTC), long amortization (up to 40 years), non-recourse.",
  },
  {
    id: "lihtc",
    name: "Low-Income Housing Tax Credit (LIHTC)",
    level: "Federal",
    agency: "IRS / State Housing Finance Agencies",
    type: "Tax Credit",
    propertyTypes: ["multi-unit"],
    projectTypes: ["new-build", "remodel-rehab", "affordable-housing-development"],
    eligibility:
      "Developers building or substantially rehabbing rental housing with income-restricted, below-market rents; allocated competitively through state HFAs.",
    description:
      "The largest federal program for financing affordable rental housing — investors receive tax credits in exchange for equity that funds construction/rehab, in return for keeping rents affordable.",
    typicalBenefit: "Equity financing covering a large share of project cost in exchange for rent restrictions (typically 30 years).",
  },
  {
    id: "historic-tax-credit",
    name: "Federal Historic Rehabilitation Tax Credit",
    level: "Federal",
    agency: "IRS / National Park Service",
    type: "Tax Credit",
    propertyTypes: ["any"],
    projectTypes: ["remodel-rehab", "historic-preservation"],
    eligibility:
      "Income-producing properties listed on (or eligible for) the National Register of Historic Places, rehabbed to Secretary of the Interior's Standards.",
    description:
      "A federal income tax credit for substantial, certified rehabilitation of historic income-producing buildings — applies to residential rentals and commercial alike.",
    typicalBenefit: "20% federal tax credit on qualified rehabilitation expenses.",
  },
  {
    id: "opportunity-zones",
    name: "Qualified Opportunity Zone Tax Incentives",
    level: "Federal",
    agency: "IRS / U.S. Treasury",
    type: "Tax Incentive",
    propertyTypes: ["any"],
    projectTypes: ["new-build", "remodel-rehab", "acquisition"],
    eligibility:
      "Capital gains reinvested into a Qualified Opportunity Fund that invests in property within a designated Opportunity Zone; new construction or \"substantial improvement\" of existing property.",
    description:
      "Defers (and can reduce/eliminate) capital gains tax by reinvesting gains into real estate development or substantial rehab within designated low-income census tracts.",
    typicalBenefit: "Capital gains tax deferral, with potential exclusion of new gains after a 10-year hold.",
  },
  {
    id: "energy-efficient-home-improvement-credit",
    name: "Energy Efficient Home Improvement Credit (IRC §25C)",
    level: "Federal",
    agency: "IRS",
    type: "Tax Credit",
    propertyTypes: ["single-family", "duplex"],
    projectTypes: ["energy-efficiency", "remodel-rehab"],
    eligibility:
      "Owners making qualifying energy-efficiency improvements to an existing home (insulation, efficient HVAC, windows/doors, electrical panel upgrades, etc.).",
    description:
      "Annual tax credit for a broad range of home energy-efficiency upgrades — relevant to rehab budgets on owner-occupied or house-hacked properties.",
    typicalBenefit: "Up to 30% of cost, subject to annual per-category caps (varies by improvement type).",
  },
  {
    id: "residential-clean-energy-credit",
    name: "Residential Clean Energy Credit (IRC §25D)",
    level: "Federal",
    agency: "IRS",
    type: "Tax Credit",
    propertyTypes: ["single-family", "duplex"],
    projectTypes: ["energy-efficiency"],
    eligibility: "Owners installing solar, small wind, geothermal, or battery storage systems.",
    description:
      "Tax credit for renewable energy systems installed on a residential property — can offset part of a value-add renovation budget for solar/battery installs.",
    typicalBenefit: "30% of system cost, no annual cap, through the credit's current phase-down schedule.",
  },
  {
    id: "commercial-48-itc",
    name: "Commercial Clean Energy Investment Tax Credit (IRC §48)",
    level: "Federal",
    agency: "IRS",
    type: "Tax Credit",
    propertyTypes: ["multi-unit", "commercial"],
    projectTypes: ["energy-efficiency", "new-build", "remodel-rehab"],
    eligibility: "Owners of commercial and multifamily properties installing qualifying clean energy systems.",
    description:
      "The commercial counterpart to the residential solar credit — covers solar, storage, and other qualifying clean energy systems on larger properties.",
    typicalBenefit: "Base credit around 6% of qualifying cost, up to 30%+ with prevailing wage/apprenticeship and bonus adders.",
  },
  {
    id: "weatherization-assistance-program",
    name: "Weatherization Assistance Program (WAP)",
    level: "Federal",
    agency: "U.S. Department of Energy (administered by states/local agencies)",
    type: "Grant",
    propertyTypes: ["single-family", "duplex", "multi-unit"],
    projectTypes: ["energy-efficiency"],
    eligibility: "Income-qualified households (owner or renter-occupied); landlords must typically cost-share for rental units.",
    description:
      "Fully funds (or heavily subsidizes) weatherization improvements — insulation, air sealing, HVAC tune-ups — for income-qualified housing, including rental units in some states.",
    typicalBenefit: "Free or heavily subsidized weatherization work, administered locally.",
  },
  {
    id: "liheap",
    name: "Low Income Home Energy Assistance Program (LIHEAP)",
    level: "Federal",
    agency: "U.S. Department of Health & Human Services (administered by states)",
    type: "Grant",
    propertyTypes: ["single-family", "duplex", "multi-unit"],
    projectTypes: ["energy-efficiency"],
    eligibility: "Income-qualified households; primarily helps tenants/homeowners with energy bills, with some states allowing minor efficiency repairs.",
    description:
      "Primarily a bill-assistance program, but relevant context for landlords of income-qualified tenants and occasionally funds minor energy-related repairs.",
    typicalBenefit: "Varies by state; mostly bill assistance, occasionally minor repair funding.",
  },
  {
    id: "cdbg",
    name: "Community Development Block Grant (CDBG)",
    level: "Federal",
    agency: "HUD (funds passed through to states/cities/counties)",
    type: "Grant",
    propertyTypes: ["any"],
    projectTypes: ["remodel-rehab", "new-build", "affordable-housing-development"],
    eligibility:
      "Varies by local administering agency — often targets rehab of housing serving low/moderate-income residents, blighted-area redevelopment, or small-scale affordable development.",
    description:
      "Federal funds distributed to local governments, who run their own CDBG-funded rehab/development programs — availability and rules vary significantly by city/county.",
    typicalBenefit: "Varies widely by locality — check your city or county's community development department.",
  },
  {
    id: "home-investment-partnerships",
    name: "HOME Investment Partnerships Program",
    level: "Federal",
    agency: "HUD (funds passed through to states/local participating jurisdictions)",
    type: "Grant",
    propertyTypes: ["any"],
    projectTypes: ["new-build", "remodel-rehab", "affordable-housing-development"],
    eligibility: "Developers/owners producing or preserving affordable housing, via local participating jurisdictions.",
    description:
      "The largest federal block grant dedicated exclusively to creating affordable housing for low-income households — funds new construction, rehab, and rental assistance through local programs.",
    typicalBenefit: "Varies by locality — often gap financing alongside other funding sources.",
  },
  {
    id: "state-hfa-programs",
    name: "State Housing Finance Agency (HFA) Programs",
    level: "State/Local",
    agency: "Your state's Housing Finance Agency",
    type: "Financing Program",
    propertyTypes: ["any"],
    projectTypes: ["acquisition", "remodel-rehab", "down-payment-assistance", "affordable-housing-development"],
    eligibility: "Varies widely by state and program (owner-occupant down payment assistance, rehab loans, multifamily gap financing, etc.).",
    description:
      "Every state has an HFA running its own mix of down payment assistance, below-market rehab loans, and multifamily development financing — this is often the single best starting point for state-level funding research.",
    typicalBenefit: "Varies widely — search '[Your State] Housing Finance Agency' for the current program list.",
  },
  {
    id: "pace-financing",
    name: "PACE (Property Assessed Clean Energy) Financing",
    level: "State/Local",
    agency: "State/local PACE programs (residential R-PACE, commercial C-PACE)",
    type: "Financing Program",
    propertyTypes: ["single-family", "duplex", "multi-unit", "commercial"],
    projectTypes: ["energy-efficiency", "remodel-rehab"],
    eligibility: "Property owners in states/municipalities with an active PACE program; varies by jurisdiction.",
    description:
      "Financing for energy efficiency, renewable energy, water conservation, and resiliency upgrades, repaid as a line item on the property tax bill rather than a separate loan.",
    typicalBenefit: "100% financing for qualifying upgrades with long repayment terms (10-20+ years) tied to the property, not the borrower.",
  },
  {
    id: "sba-504",
    name: "SBA 504 Loan Program",
    level: "Federal",
    agency: "U.S. Small Business Administration",
    type: "Loan Insurance/Guarantee",
    propertyTypes: ["commercial"],
    projectTypes: ["acquisition", "new-build", "remodel-rehab"],
    eligibility: "Small businesses purchasing or building owner-occupied commercial real estate (must occupy ≥51% of an existing building, ≥60% of new construction).",
    description:
      "Long-term, fixed-rate financing for owner-occupied commercial real estate, delivered through a bank loan plus a below-market second mortgage from a Certified Development Company.",
    typicalBenefit: "As low as 10% down, below-market fixed rate on the CDC portion, 25-year terms available.",
  },
  {
    id: "new-markets-tax-credit",
    name: "New Markets Tax Credit (NMTC)",
    level: "Federal",
    agency: "U.S. Treasury (CDFI Fund)",
    type: "Tax Credit",
    propertyTypes: ["commercial", "multi-unit"],
    projectTypes: ["new-build", "remodel-rehab", "affordable-housing-development"],
    eligibility: "Commercial/mixed-use projects in qualifying low-income census tracts; allocated through Community Development Entities.",
    description:
      "Attracts private investment into low-income communities via tax credits to investors who provide below-market financing for qualifying commercial or mixed-use development.",
    typicalBenefit: "Below-market, often subordinated financing layered into a project's capital stack.",
  },
];

export function filterFundingPrograms(
  propertyType: PropertyTypeTag | "all",
  projectType: ProjectTypeTag | "all",
  query: string
): FundingProgram[] {
  const q = query.trim().toLowerCase();
  return FUNDING_PROGRAMS.filter((program) => {
    const matchesProperty =
      propertyType === "all" ||
      program.propertyTypes.includes(propertyType) ||
      program.propertyTypes.includes("any");
    const matchesProject =
      projectType === "all" || program.projectTypes.includes(projectType);
    const matchesQuery =
      !q ||
      program.name.toLowerCase().includes(q) ||
      program.agency.toLowerCase().includes(q) ||
      program.description.toLowerCase().includes(q);
    return matchesProperty && matchesProject && matchesQuery;
  });
}
