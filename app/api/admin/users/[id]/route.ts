import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  // An admin managing their own role/disabled state through this panel is
  // a self-lockout footgun (e.g. disabling yourself with no one else
  // around to undo it) — route that through normal account settings
  // instead, which doesn't exist yet, so for now it's simply blocked.
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "You can't change your own role or disabled status from here." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: { role?: "USER" | "ADMIN"; disabledAt?: Date | null } = {};

  if ("role" in body) {
    if (body.role !== "USER" && body.role !== "ADMIN") {
      return NextResponse.json({ error: "role must be USER or ADMIN." }, { status: 400 });
    }
    data.role = body.role;
  }

  if ("disabled" in body) {
    if (typeof body.disabled !== "boolean") {
      return NextResponse.json({ error: "disabled must be a boolean." }, { status: 400 });
    }
    data.disabledAt = body.disabled ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updated = await prisma.user.update({ where: { id: params.id }, data });

  return NextResponse.json({
    id: updated.id,
    role: updated.role,
    disabled: !!updated.disabledAt,
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account from here." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Cascades to their saved analyses / tokens (see prisma/schema.prisma
  // onDelete: Cascade on those relations).
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
