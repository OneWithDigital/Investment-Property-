import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  analyzeDuplex,
  evaluateDuplexVerdict,
  DEFAULT_DUPLEX_INPUTS,
  type DuplexInputs,
} from "@/lib/calc/duplex";
import {
  analyzeMultiUnit,
  evaluateMultiUnitVerdict,
  DEFAULT_MULTI_UNIT_INPUTS,
  type MultiUnitInputs,
} from "@/lib/calc/multiUnit";
import {
  analyzeCommercial,
  evaluateCommercialVerdict,
  DEFAULT_COMMERCIAL_INPUTS,
  type CommercialInputs,
} from "@/lib/calc/commercial";
import {
  analyzeShortTermRental,
  evaluateShortTermRentalVerdict,
  DEFAULT_STR_INPUTS,
  type ShortTermRentalInputs,
} from "@/lib/calc/shortTermRental";
import { extractStateFromAddress, findStateFactor } from "@/lib/locationFactors";

function isFiniteNonNegative(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isFiniteNonNegative(body.purchasePrice) || body.purchasePrice <= 0) {
    return NextResponse.json(
      { error: "Purchase price must be a positive number." },
      { status: 400 }
    );
  }

  const address = typeof body.address === "string" ? body.address : "";
  const stateAbbr = extractStateFromAddress(address);
  const stateFactor = stateAbbr ? findStateFactor(stateAbbr) : null;

  switch (params.type) {
    case "duplex": {
      const inputs: DuplexInputs = { ...DEFAULT_DUPLEX_INPUTS, ...body, address };
      if (!Array.isArray(inputs.units) || inputs.units.length === 0) {
        return NextResponse.json({ error: "At least one unit is required." }, { status: 400 });
      }
      const result = analyzeDuplex(inputs);
      const verdict = evaluateDuplexVerdict(result, inputs);
      return NextResponse.json({ inputs, result, verdict, stateFactor });
    }
    case "multi-unit": {
      const inputs: MultiUnitInputs = { ...DEFAULT_MULTI_UNIT_INPUTS, ...body, address };
      if (!Array.isArray(inputs.unitMix) || inputs.unitMix.length === 0) {
        return NextResponse.json(
          { error: "At least one unit type is required." },
          { status: 400 }
        );
      }
      const result = analyzeMultiUnit(inputs);
      const verdict = evaluateMultiUnitVerdict(result, inputs);
      return NextResponse.json({ inputs, result, verdict, stateFactor });
    }
    case "commercial": {
      const inputs: CommercialInputs = { ...DEFAULT_COMMERCIAL_INPUTS, ...body, address };
      const result = analyzeCommercial(inputs);
      const verdict = evaluateCommercialVerdict(result, inputs);
      return NextResponse.json({ inputs, result, verdict, stateFactor });
    }
    case "short-term-rental": {
      const inputs: ShortTermRentalInputs = { ...DEFAULT_STR_INPUTS, ...body, address };
      const result = analyzeShortTermRental(inputs);
      const verdict = evaluateShortTermRentalVerdict(result, inputs);
      return NextResponse.json({ inputs, result, verdict, stateFactor });
    }
    default:
      return NextResponse.json({ error: `Unknown analyzer type: ${params.type}` }, { status: 404 });
  }
}
