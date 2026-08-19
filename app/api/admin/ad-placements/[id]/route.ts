import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

const EDITABLE_FIELDS = [
  "type",
  "slot",
  "title",
  "body",
  "url",
  "imageUrl",
  "active",
  "sortOrder",
  "startsAt",
  "endsAt",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const existing = await prisma.adPlacement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (!(field in body)) continue;
    if (field === "startsAt" || field === "endsAt") {
      data[field] = body[field] ? new Date(body[field]) : null;
    } else {
      data[field] = body[field];
    }
  }

  const updated = await prisma.adPlacement.update({ where: { id: params.id }, data });
  return NextResponse.json({ placement: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const existing = await prisma.adPlacement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.adPlacement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
