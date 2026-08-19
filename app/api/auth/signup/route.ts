import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/authEmails";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getAppSetting } from "@/lib/appSettings";
import { isLikelyBot } from "@/lib/botCheck";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  if (!(await getAppSetting("signupsEnabled"))) {
    return NextResponse.json(
      { error: "New signups are temporarily disabled. Please check back later." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);

  if (isLikelyBot({ honeypot: body?.honeypot, formRenderedAt: body?.formRenderedAt })) {
    // Same generic error a real validation failure would show — a
    // bot-specific message just tells the bot what to fix.
    return NextResponse.json({ error: "Something went wrong creating your account." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, hashedPassword, name: name || null },
  });

  // Best-effort: never block account creation on email delivery issues.
  try {
    await sendVerificationEmail(user.id, user.email);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({ id: user.id, email: user.email });
}
