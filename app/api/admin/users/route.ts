import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      disabledAt: true,
      createdAt: true,
      _count: { select: { savedAnalyses: true } },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: !!u.emailVerified,
      disabled: !!u.disabledAt,
      createdAt: u.createdAt.toISOString(),
      savedAnalysesCount: u._count.savedAnalyses,
    })),
  });
}
