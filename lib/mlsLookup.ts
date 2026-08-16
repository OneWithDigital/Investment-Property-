/**
 * Property comps / valuation lookup via RentCast (https://www.rentcast.io/api).
 *
 * This is what actually covers "pull data from MLS-style listings" —
 * RentCast aggregates MLS, public record, and rental listing data behind
 * a normal REST API (no scraping, no ToS problems), which is the
 * realistic way to get comps/rent-estimate data into this app. It's
 * primarily a residential product (single-family, condo, small
 * multifamily), so this is wired up for the residential tabs — not
 * multi-unit apartments or commercial, which don't have a comparable
 * self-serve data API.
 *
 * Degrades gracefully with no API key configured, same pattern as the
 * Zillow lookup: return a clear "not configured" result rather than
 * failing silently or throwing.
 */
export interface MlsLookupResult {
  configured: boolean;
  fetched: boolean;
  error: string | null;
  address: string | null;
  estimatedValue: number | null;
  estimatedValueRangeLow: number | null;
  estimatedValueRangeHigh: number | null;
  estimatedRent: number | null;
  estimatedRentRangeLow: number | null;
  estimatedRentRangeHigh: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  propertyType: string | null;
  yearBuilt: number | null;
}

const EMPTY_RESULT: Omit<MlsLookupResult, "configured" | "fetched" | "error" | "address"> = {
  estimatedValue: null,
  estimatedValueRangeLow: null,
  estimatedValueRangeHigh: null,
  estimatedRent: null,
  estimatedRentRangeLow: null,
  estimatedRentRangeHigh: null,
  bedrooms: null,
  bathrooms: null,
  squareFootage: null,
  propertyType: null,
  yearBuilt: null,
};

async function rentcastGet(path: string, apiKey: string, signal: AbortSignal) {
  const res = await fetch(`https://api.rentcast.io/v1${path}`, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`RentCast returned HTTP ${res.status}`);
  }
  return res.json();
}

export async function lookupPropertyComps(address: string): Promise<MlsLookupResult> {
  const apiKey = process.env.RENTCAST_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      fetched: false,
      error:
        "MLS/comps lookup isn't configured yet. Add a RENTCAST_API_KEY to your environment to enable it (see README) — until then, enter price/rent estimates manually.",
      address,
      ...EMPTY_RESULT,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const encodedAddress = encodeURIComponent(address);

  try {
    const [valueResult, rentResult] = await Promise.allSettled([
      rentcastGet(`/avm/value?address=${encodedAddress}`, apiKey, controller.signal),
      rentcastGet(`/avm/rent/long-term?address=${encodedAddress}`, apiKey, controller.signal),
    ]);

    const value = valueResult.status === "fulfilled" ? valueResult.value : null;
    const rent = rentResult.status === "fulfilled" ? rentResult.value : null;

    if (!value && !rent) {
      const reason =
        valueResult.status === "rejected" ? valueResult.reason : rentResult.status === "rejected" ? rentResult.reason : null;
      return {
        configured: true,
        fetched: false,
        error: `Couldn't get comps for this address (${reason instanceof Error ? reason.message : "no data returned"}). Double-check the address or enter numbers manually.`,
        address,
        ...EMPTY_RESULT,
      };
    }

    return {
      configured: true,
      fetched: true,
      error: null,
      address,
      estimatedValue: value?.price ?? null,
      estimatedValueRangeLow: value?.priceRangeLow ?? null,
      estimatedValueRangeHigh: value?.priceRangeHigh ?? null,
      estimatedRent: rent?.rent ?? null,
      estimatedRentRangeLow: rent?.rentRangeLow ?? null,
      estimatedRentRangeHigh: rent?.rentRangeHigh ?? null,
      bedrooms: value?.bedrooms ?? rent?.bedrooms ?? null,
      bathrooms: value?.bathrooms ?? rent?.bathrooms ?? null,
      squareFootage: value?.squareFootage ?? rent?.squareFootage ?? null,
      propertyType: value?.propertyType ?? rent?.propertyType ?? null,
      yearBuilt: value?.yearBuilt ?? null,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Comps lookup timed out. Try again or enter numbers manually."
        : "Couldn't reach the comps data service. Enter numbers manually.";
    return { configured: true, fetched: false, error: message, address, ...EMPTY_RESULT };
  } finally {
    clearTimeout(timeout);
  }
}
