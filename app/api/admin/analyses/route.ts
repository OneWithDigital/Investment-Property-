import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { PRISMA_TYPE_TO_SLUG, extractSummaryMetrics } from "@/lib/savedAnalysis";

// Capped rather than paginated — this is an admin overview, not a
// primary workflow, and the app has no scale where 500 rows matters yet.
const MAX_ROWS = 500;

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const analyses = await prisma.savedAnalysis.findMany({
    where: q
      ? {
          OR: [
            { label: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: MAX_ROWS,
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json({
    analyses: analyses.map((a) => ({
      id: a.id,
      propertyType: PRISMA_TYPE_TO_SLUG[a.propertyType],
      label: a.label,
      address: a.address,
      ownerEmail: a.user.email,
      ownerName: a.user.name,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      ...extractSummaryMetrics(a.result, a.verdict),
    })),
    truncated: analyses.length === MAX_ROWS,
  });
}
