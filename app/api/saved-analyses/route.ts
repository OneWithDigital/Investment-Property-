import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidSlug, SLUG_TO_PRISMA_TYPE, PRISMA_TYPE_TO_SLUG, extractSummaryMetrics } from "@/lib/savedAnalysis";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyTypeParam = request.nextUrl.searchParams.get("propertyType");
  const where: { userId: string; propertyType?: (typeof SLUG_TO_PRISMA_TYPE)[keyof typeof SLUG_TO_PRISMA_TYPE] } = {
    userId: session.user.id,
  };
  if (propertyTypeParam && isValidSlug(propertyTypeParam)) {
    where.propertyType = SLUG_TO_PRISMA_TYPE[propertyTypeParam];
  }

  const analyses = await prisma.savedAnalysis.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const summaries = analyses.map((a) => ({
    id: a.id,
    propertyType: PRISMA_TYPE_TO_SLUG[a.propertyType],
    label: a.label,
    address: a.address,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    ...extractSummaryMetrics(a.result, a.verdict),
  }));

  return NextResponse.json({ analyses: summaries });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { propertyType, label, address, inputs, result, verdict } = body;

  if (typeof propertyType !== "string" || !isValidSlug(propertyType)) {
    return NextResponse.json({ error: "Invalid or missing propertyType." }, { status: 400 });
  }
  if (typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Label is required." }, { status: 400 });
  }
  if (!inputs || !result || !verdict) {
    return NextResponse.json({ error: "inputs, result, and verdict are all required." }, { status: 400 });
  }

  const saved = await prisma.savedAnalysis.create({
    data: {
      userId: session.user.id,
      propertyType: SLUG_TO_PRISMA_TYPE[propertyType],
      label: label.trim(),
      address: typeof address === "string" ? address : null,
      inputs,
      result,
      verdict,
    },
  });

  return NextResponse.json({
    id: saved.id,
    propertyType: PRISMA_TYPE_TO_SLUG[saved.propertyType],
    label: saved.label,
    address: saved.address,
    createdAt: saved.createdAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
  });
}
