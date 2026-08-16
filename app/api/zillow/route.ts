import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchZillowListing, isZillowUrl, parseZillowUrl } from "@/lib/zillow";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' in request body." }, { status: 400 });
  }

  if (!isZillowUrl(url)) {
    // Not a Zillow URL — just try to hand back a parsed address shell
    // so the caller can still use it as a free-text address label.
    return NextResponse.json({
      address: null,
      zpid: null,
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
      fetchError: "That doesn't look like a zillow.com URL.",
    });
  }

  try {
    const result = await fetchZillowListing(url);
    return NextResponse.json(result);
  } catch (err) {
    const { address, zpid } = parseZillowUrl(url);
    return NextResponse.json({
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
      fetchError: "Unexpected error contacting Zillow. Enter the numbers manually.",
    });
  }
}
