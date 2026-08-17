import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/authEmails";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    // Still return the generic { ok: true } shape so this can't be used
    // to distinguish "rate limited" from "no such account" either.
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  // Always respond success regardless of whether the account exists, so
  // this endpoint can't be used to enumerate registered email addresses.
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      try {
        await sendPasswordResetEmail(user.id, user.email);
      } catch (err) {
        console.error("Failed to send password reset email:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
