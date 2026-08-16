export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login, /signup (auth pages)
     * - /api/auth/* (NextAuth + signup endpoints)
     * - Next.js internals and static assets
     */
    "/((?!login|signup|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
