import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // /admin and /api/admin need the ADMIN role, not just a session.
      // Every admin API route also re-checks this server-side via
      // lib/adminAuth.ts — this is defense in depth, not the only gate.
      if (req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/api/admin")) {
        return token?.role === "ADMIN";
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login, /signup (auth pages)
     * - /verify-email, /forgot-password, /reset-password — these MUST
     *   stay reachable while logged out; they're precisely how a
     *   logged-out (or newly-signed-up, not-yet-verified) user regains
     *   access, so gating them behind auth would be self-defeating.
     * - /api/auth/* (NextAuth + signup + verification/reset endpoints)
     * - Next.js internals and static assets
     */
    "/((?!login|signup|verify-email|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
