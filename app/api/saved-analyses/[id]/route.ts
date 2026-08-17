import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRISMA_TYPE_TO_SLUG } from "@/lib/savedAnalysis";

async function getOwnedAnalysis(id: string, userId: string) {
  const analysis = await prisma.savedAnalysis.findUnique({ where: { id } });
  if (!analysis || analysis.userId !== userId) return null;
  return analysis;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analysis = await getOwnedAnalysis(params.id, session.user.id);
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: analysis.id,
    propertyType: PRISMA_TYPE_TO_SLUG[analysis.propertyType],
    label: analysis.label,
    address: analysis.address,
    inputs: analysis.inputs,
    result: analysis.result,
    verdict: analysis.verdict,
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedAnalysis(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: {
    label?: string;
    inputs?: Prisma.InputJsonValue;
    result?: Prisma.InputJsonValue;
    verdict?: Prisma.InputJsonValue;
  } = {};
  if (typeof body.label === "string" && body.label.trim()) data.label = body.label.trim();
  if (body.inputs !== undefined) data.inputs = body.inputs;
  if (body.result !== undefined) data.result = body.result;
  if (body.verdict !== undefined) data.verdict = body.verdict;

  const updated = await prisma.savedAnalysis.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    label: updated.label,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedAnalysis(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedAnalysis.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
