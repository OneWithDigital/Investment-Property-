export type LandlordFriendliness = "landlord-friendly" | "balanced" | "tenant-friendly";

export interface StateFactor {
  state: string;
  abbreviation: string;
  friendliness: LandlordFriendliness;
  notes: string;
}

/**
 * High-level landlord/tenant regulatory climate by state, based on
 * commonly-cited factors: eviction timelines, security deposit limits,
 * rent control presence, and notice requirements. This is a starting
 * point for due diligence, not legal advice — always verify current
 * local ordinances (many rent-control rules are city-level, not just
 * state-level, e.g. specific cities in CA, OR, NJ, MD, and WA).
 */
export const STATE_FACTORS: StateFactor[] = [
  { state: "Alabama", abbreviation: "AL", friendliness: "landlord-friendly", notes: "No state rent control, fast eviction process." },
  { state: "Alaska", abbreviation: "AK", friendliness: "balanced", notes: "No rent control; moderate notice requirements." },
  { state: "Arizona", abbreviation: "AZ", friendliness: "landlord-friendly", notes: "No rent control (preempted by state law), efficient eviction courts." },
  { state: "Arkansas", abbreviation: "AR", friendliness: "landlord-friendly", notes: "One of the most landlord-friendly states; minimal tenant protections." },
  { state: "California", abbreviation: "CA", friendliness: "tenant-friendly", notes: "Statewide rent cap (AB 1482), just-cause eviction rules, strong tenant protections in many cities (LA, SF, Oakland)." },
  { state: "Colorado", abbreviation: "CO", friendliness: "balanced", notes: "Rent control preemption repealed in 2023; some cities may adopt local rules." },
  { state: "Connecticut", abbreviation: "CT", friendliness: "tenant-friendly", notes: "Fair rent commissions in some towns, longer eviction timelines." },
  { state: "Delaware", abbreviation: "DE", friendliness: "balanced", notes: "Landlord-Tenant Code is moderate; no statewide rent control." },
  { state: "Florida", abbreviation: "FL", friendliness: "landlord-friendly", notes: "No rent control, fast evictions, but rising insurance costs are a major underwriting risk." },
  { state: "Georgia", abbreviation: "GA", friendliness: "landlord-friendly", notes: "No rent control, quick eviction process." },
  { state: "Hawaii", abbreviation: "HI", friendliness: "tenant-friendly", notes: "High cost of entry, tenant-protective statutes." },
  { state: "Idaho", abbreviation: "ID", friendliness: "landlord-friendly", notes: "Minimal regulation, fast evictions." },
  { state: "Illinois", abbreviation: "IL", friendliness: "tenant-friendly", notes: "Chicago has its own strict landlord-tenant ordinance (RLTO) beyond state law." },
  { state: "Indiana", abbreviation: "IN", friendliness: "landlord-friendly", notes: "Low regulation, business-friendly." },
  { state: "Iowa", abbreviation: "IA", friendliness: "landlord-friendly", notes: "Straightforward landlord-tenant code." },
  { state: "Kansas", abbreviation: "KS", friendliness: "landlord-friendly", notes: "Minimal tenant protections." },
  { state: "Kentucky", abbreviation: "KY", friendliness: "landlord-friendly", notes: "Varies by county (URLTA adoption); generally favorable." },
  { state: "Louisiana", abbreviation: "LA", friendliness: "landlord-friendly", notes: "Civil law system, fast eviction (\"eviction by rule\")." },
  { state: "Maine", abbreviation: "ME", friendliness: "tenant-friendly", notes: "Notice and just-cause protections in larger cities like Portland." },
  { state: "Maryland", abbreviation: "MD", friendliness: "tenant-friendly", notes: "Montgomery County and Takoma Park have local rent stabilization." },
  { state: "Massachusetts", abbreviation: "MA", friendliness: "tenant-friendly", notes: "Strong tenant protections, security deposit rules are strict." },
  { state: "Michigan", abbreviation: "MI", friendliness: "balanced", notes: "Moderate regulation; no statewide rent control." },
  { state: "Minnesota", abbreviation: "MN", friendliness: "tenant-friendly", notes: "Minneapolis/St. Paul have local tenant protections and rent stabilization votes." },
  { state: "Mississippi", abbreviation: "MS", friendliness: "landlord-friendly", notes: "Minimal statutory tenant protections." },
  { state: "Missouri", abbreviation: "MO", friendliness: "landlord-friendly", notes: "Fast eviction process, low regulation." },
  { state: "Montana", abbreviation: "MT", friendliness: "balanced", notes: "Moderate landlord-tenant code." },
  { state: "Nebraska", abbreviation: "NE", friendliness: "balanced", notes: "URTLA-based moderate protections." },
  { state: "Nevada", abbreviation: "NV", friendliness: "landlord-friendly", notes: "No rent control, relatively fast evictions." },
  { state: "New Hampshire", abbreviation: "NH", friendliness: "balanced", notes: "Just-cause eviction protections statewide." },
  { state: "New Jersey", abbreviation: "NJ", friendliness: "tenant-friendly", notes: "Many municipalities have local rent control ordinances." },
  { state: "New Mexico", abbreviation: "NM", friendliness: "balanced", notes: "Moderate protections, no statewide rent control." },
  { state: "New York", abbreviation: "NY", friendliness: "tenant-friendly", notes: "NYC rent stabilization, statewide Housing Stability Act (2019) limits fees and increases." },
  { state: "North Carolina", abbreviation: "NC", friendliness: "landlord-friendly", notes: "Rent control is preempted by state law." },
  { state: "North Dakota", abbreviation: "ND", friendliness: "landlord-friendly", notes: "Minimal regulation." },
  { state: "Ohio", abbreviation: "OH", friendliness: "balanced", notes: "URLTA-based, moderate protections." },
  { state: "Oklahoma", abbreviation: "OK", friendliness: "landlord-friendly", notes: "Low regulation, fast eviction process." },
  { state: "Oregon", abbreviation: "OR", friendliness: "tenant-friendly", notes: "Statewide rent cap tied to CPI, just-cause eviction after first year." },
  { state: "Pennsylvania", abbreviation: "PA", friendliness: "balanced", notes: "Philadelphia has additional tenant-protective ordinances." },
  { state: "Rhode Island", abbreviation: "RI", friendliness: "tenant-friendly", notes: "Tenant-protective statutes, longer eviction timelines." },
  { state: "South Carolina", abbreviation: "SC", friendliness: "landlord-friendly", notes: "Low regulation, efficient courts." },
  { state: "South Dakota", abbreviation: "SD", friendliness: "landlord-friendly", notes: "Minimal statutory protections." },
  { state: "Tennessee", abbreviation: "TN", friendliness: "landlord-friendly", notes: "No rent control; URLTA only applies in larger counties." },
  { state: "Texas", abbreviation: "TX", friendliness: "landlord-friendly", notes: "No rent control, fast eviction process, no state income tax (offset by high property taxes)." },
  { state: "Utah", abbreviation: "UT", friendliness: "landlord-friendly", notes: "Low regulation, business-friendly courts." },
  { state: "Vermont", abbreviation: "VT", friendliness: "tenant-friendly", notes: "Tenant-protective notice and habitability rules." },
  { state: "Virginia", abbreviation: "VA", friendliness: "balanced", notes: "VRLTA governs most jurisdictions; moderate protections." },
  { state: "Washington", abbreviation: "WA", friendliness: "tenant-friendly", notes: "Statewide rent increase cap (2024 law) and just-cause eviction statewide." },
  { state: "West Virginia", abbreviation: "WV", friendliness: "landlord-friendly", notes: "Minimal regulation." },
  { state: "Wisconsin", abbreviation: "WI", friendliness: "landlord-friendly", notes: "Rent control preempted by state law since 1995." },
  { state: "Wyoming", abbreviation: "WY", friendliness: "landlord-friendly", notes: "Minimal regulation, no state income tax." },
  { state: "District of Columbia", abbreviation: "DC", friendliness: "tenant-friendly", notes: "Rent control on many older buildings (TOPA), strong tenant protections." },
];

export function findStateFactor(input: string): StateFactor | null {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;
  return (
    STATE_FACTORS.find(
      (s) =>
        s.abbreviation === normalized ||
        s.state.toUpperCase() === normalized
    ) ?? null
  );
}

/**
 * Extract a likely two-letter state abbreviation from a free-text
 * US address string like "123 Main St, Austin, TX 78701".
 */
export function extractStateFromAddress(address: string): string | null {
  const match = address.match(/,\s*([A-Za-z]{2})\s*\d{5}(-\d{4})?\s*$/);
  if (match?.[1]) return match[1].toUpperCase();
  const fallback = address.match(/,\s*([A-Za-z]{2})\s*$/);
  return fallback?.[1] ? fallback[1].toUpperCase() : null;
}

export interface DueDiligenceItem {
  category: string;
  question: string;
  why: string;
}

/**
 * Qualitative checklist covering the "beyond the spreadsheet" factors
 * that experienced investors (e.g. BiggerPockets' four pillars, Gary
 * Keller's "Millionaire Real Estate Investor") weigh alongside the raw
 * numbers: location, condition, market cycle, and financing structure.
 */
export const DUE_DILIGENCE_CHECKLIST: DueDiligenceItem[] = [
  {
    category: "Location",
    question: "How are local school ratings (GreatSchools, Niche)?",
    why: "Directly correlates with tenant quality, resale demand, and long-term appreciation.",
  },
  {
    category: "Location",
    question: "What is the neighborhood crime trend (rising or falling)?",
    why: "Affects vacancy, insurance premiums, and appreciation potential.",
  },
  {
    category: "Location",
    question: "Is the local job market and population growing?",
    why: "Population and employment growth drive rental demand and rent growth; check BLS/Census data for the metro.",
  },
  {
    category: "Location",
    question: "Is the property in a flood zone or high natural-disaster-risk area (FEMA maps)?",
    why: "Flood/wildfire/hurricane exposure can spike insurance costs or make the property uninsurable.",
  },
  {
    category: "Location",
    question: "What's the area's rent-to-price trend over the last 3-5 years?",
    why: "Tells you whether you're buying into a market with room to grow or one that's already peaked.",
  },
  {
    category: "Regulation",
    question: "Does the state/city have rent control, just-cause eviction, or strict security deposit laws?",
    why: "Caps your ability to raise rents or remove a non-paying tenant; changes risk profile materially.",
  },
  {
    category: "Regulation",
    question: "Are short-term rentals (Airbnb) restricted in this area, if that's part of the strategy?",
    why: "Many cities have added STR permit caps or outright bans in recent years.",
  },
  {
    category: "Property",
    question: "Age and condition of major systems (roof, HVAC, water heater, electrical, plumbing)?",
    why: "Deferred maintenance turns into surprise CapEx that erodes cash flow.",
  },
  {
    category: "Property",
    question: "Any pending special assessments (HOA) or known code violations?",
    why: "Can create unbudgeted one-time costs after closing.",
  },
  {
    category: "Financing",
    question: "Is the estimated rent based on actual comps (not just Zestimate)?",
    why: "Rent Zestimates and rules of thumb can be off 10-20%+ in either direction versus real comps.",
  },
  {
    category: "Financing",
    question: "Have you gotten a real insurance quote (not an assumption)?",
    why: "In parts of FL, CA, LA, and coastal TX, insurance can be 2-4x a naive assumption and single-handedly break the deal.",
  },
  {
    category: "Exit Strategy",
    question: "What's the plan if you need to sell in a down market?",
    why: "Cash flow protects you while you hold; know your exit before you buy, not after.",
  },
];
