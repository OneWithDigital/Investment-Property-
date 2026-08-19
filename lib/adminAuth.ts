import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "./auth";

/**
 * Server-side admin gate for API routes. Middleware already blocks
 * non-admins from reaching /api/admin/*, but that's request-routing
 * defense in depth, not a substitute for checking here too — route
 * handlers must not trust that middleware ran the way they expect.
 */
export async function requireAdmin(): Promise<
  { session: Session; response: null } | { session: null; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, response: null };
}
