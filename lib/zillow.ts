import type { ZillowLookupResult } from "./types";

const US_STATE_ABBRS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
]);

/**
 * Best-effort parse of a Zillow "homedetails" URL into a human-readable
 * address and zpid, using the URL slug alone (no network call).
 * e.g. https://www.zillow.com/homedetails/123-Main-St-Springfield-IL-62701/12345678_zpid/
 */
export function parseZillowUrl(
  url: string
): { address: string | null; zpid: string | null } {
  try {
    const parsed = new URL(url);
    if (!/zillow\.com$/i.test(parsed.hostname.replace(/^www\./, ""))) {
      return { address: null, zpid: null };
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    const zpidSegment = segments.find((s) => /^\d+_zpid$/i.test(s));
    const zpid = zpidSegment ? zpidSegment.replace(/_zpid$/i, "") : null;

    const slugIndex = segments.findIndex((s) => s === "homedetails");
    const slug = slugIndex >= 0 ? segments[slugIndex + 1] : null;
    if (!slug) return { address: null, zpid };

    const tokens = slug.split("-").filter(Boolean);
    // Heuristic: [...street words] [City words] [ST] [ZIP]
    const zip = /^\d{5}$/.test(tokens[tokens.length - 1] ?? "")
      ? tokens.pop()
      : null;
    const state = US_STATE_ABBRS.has((tokens[tokens.length - 1] ?? "").toUpperCase())
      ? tokens.pop()
      : null;

    if (!state) {
      // Can't confidently split street vs city; return the whole slug as-is.
      const fallback = tokens.join(" ").replace(/\bApt\b/i, "Apt");
      return { address: fallback || null, zpid };
    }

    // Assume the last 1-2 remaining tokens before state are the city.
    const cityWordCount = tokens.length > 3 ? 2 : 1;
    const cityTokens = tokens.splice(Math.max(tokens.length - cityWordCount, 0));
    const streetTokens = tokens;

    const street = streetTokens.join(" ");
    const city = cityTokens.join(" ");
    const address = [street, city ? `${city}, ${state}` : state, zip]
      .filter(Boolean)
      .join(zip ? " " : ", ");

    return { address: address || null, zpid };
  } catch {
    return { address: null, zpid: null };
  }
}

function extractNumberAfterKey(html: string, key: string): number | null {
  const match = html.match(new RegExp(`"${key}"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`));
  return match?.[1] ? Number(match[1]) : null;
}

function extractStringAfterKey(html: string, key: string): string | null {
  const match = html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
  return match?.[1] ?? null;
}

/**
 * Best-effort server-side fetch of a public Zillow listing page.
 *
 * Zillow runs aggressive bot detection (PerimeterX) in front of most
 * pages, so this WILL frequently fail or get blocked, especially from
 * data-center IPs — that is expected, not a bug. On any failure we
 * return `fetched: false` with a human-readable reason so the caller
 * can fall back to manual entry rather than pretending we have data
 * we don't.
 */
export async function fetchZillowListing(
  url: string
): Promise<ZillowLookupResult> {
  const { address, zpid } = parseZillowUrl(url);

  const base: ZillowLookupResult = {
    address,
    zpid,
    price: null,
    bedrooms: null,
    bathrooms: null,
    livingAreaSqft: null,
    propertyTaxAnnual: null,
    hoaMonthly: null,
    rentZestimate: null,
    zestimate: null,
    yearBuilt: null,
    homeType: null,
    fetched: false,
    fetchError: null,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return {
        ...base,
        fetchError: `Zillow returned HTTP ${response.status} (likely bot protection). Enter the numbers manually from the listing.`,
      };
    }

    const html = await response.text();

    const price = extractNumberAfterKey(html, "price");
    const zestimate = extractNumberAfterKey(html, "zestimate");
    const rentZestimate = extractNumberAfterKey(html, "rentZestimate");
    const bedrooms = extractNumberAfterKey(html, "bedrooms");
    const bathrooms = extractNumberAfterKey(html, "bathrooms");
    const livingArea = extractNumberAfterKey(html, "livingArea");
    const yearBuilt = extractNumberAfterKey(html, "yearBuilt");
    const propertyTax = extractNumberAfterKey(html, "propertyTaxRate");
    const homeType = extractStringAfterKey(html, "homeType");

    const gotAnything = [price, zestimate, rentZestimate, bedrooms].some(
      (v) => v !== null
    );

    if (!gotAnything) {
      return {
        ...base,
        fetchError:
          "Zillow's page didn't return parseable data (likely bot protection or a changed page format). Enter the numbers manually from the listing.",
      };
    }

    return {
      ...base,
      price,
      bedrooms,
      bathrooms,
      livingAreaSqft: livingArea,
      propertyTaxAnnual:
        propertyTax && price ? Math.round((propertyTax / 100) * price) : null,
      hoaMonthly: null,
      rentZestimate,
      zestimate,
      yearBuilt,
      homeType,
      fetched: true,
      fetchError: null,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Request to Zillow timed out (likely bot protection). Enter the numbers manually from the listing."
        : "Couldn't reach Zillow (likely bot protection or network restrictions). Enter the numbers manually from the listing.";
    return { ...base, fetchError: message };
  } finally {
    clearTimeout(timeout);
  }
}

export function isZillowUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return /(^|\.)zillow\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}
