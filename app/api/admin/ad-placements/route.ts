import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const placements = await prisma.adPlacement.findMany({
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ placements });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { type, slot, title, body: description, url, imageUrl, active, sortOrder, startsAt, endsAt } = body;

  if (type !== "AFFILIATE_LINK" && type !== "ADVERTISEMENT") {
    return NextResponse.json({ error: "type must be AFFILIATE_LINK or ADVERTISEMENT." }, { status: 400 });
  }
  if (typeof slot !== "string" || !slot.trim()) {
    return NextResponse.json({ error: "slot is required." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  const placement = await prisma.adPlacement.create({
    data: {
      type,
      slot: slot.trim(),
      title: title.trim(),
      body: typeof description === "string" && description.trim() ? description.trim() : null,
      url: url.trim(),
      imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
      active: typeof active === "boolean" ? active : false,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      startsAt: typeof startsAt === "string" && startsAt ? new Date(startsAt) : null,
      endsAt: typeof endsAt === "string" && endsAt ? new Date(endsAt) : null,
    },
  });

  return NextResponse.json({ placement });
}
