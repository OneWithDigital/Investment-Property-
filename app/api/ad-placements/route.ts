import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * This is what actually puts AdPlacement rows in front of a visitor —
 * open to any signed-in user (no admin role required), unlike
 * /api/admin/ad-placements. Not literally public: middleware.ts requires
 * a session for every route except the auth pages, and AdSlot is only
 * ever rendered inside that authenticated shell, so there's no
 * logged-out caller to serve. Deliberately narrow regardless: only
 * `active` rows within their optional date window, and only the fields
 * safe to show (no createdAt/updatedAt/admin metadata).
 */
export async function GET(request: NextRequest) {
  const slot = request.nextUrl.searchParams.get("slot");
  if (!slot) {
    return NextResponse.json({ error: "slot is required." }, { status: 400 });
  }

  const now = new Date();
  const placements = await prisma.adPlacement.findMany({
    where: {
      slot,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      url: true,
      imageUrl: true,
    },
  });

  return NextResponse.json({ placements });
}
