import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { rateLimit } from "./rateLimit";

/**
 * Admin bootstrap: no admin UI can create the first admin (that's the
 * chicken-and-egg problem every admin panel has), so instead an operator
 * lists trusted emails in the ADMIN_EMAILS env var (comma-separated).
 * Anyone signing in with a matching email is promoted to ADMIN in the DB
 * on that login — after which the DB role is the source of truth, and
 * role changes are managed from the admin Users page like any other user.
 * Removing an email from ADMIN_EMAILS does not demote it; use the admin
 * UI (or the DB directly) to revoke a promotion.
 */
async function maybeBootstrapAdmin(user: User): Promise<User> {
  if (user.role === "ADMIN") return user;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(user.email.toLowerCase())) return user;

  return prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        // Keyed by email (not IP) so this survives behind NextAuth's
        // internal request handling without depending on how the
        // runtime exposes the client IP to the authorize() callback.
        // Silently returning null (rather than a distinct error) avoids
        // telling a credential-stuffing attempt that it got throttled.
        const limit = rateLimit(`login:${email}`, 10, 15 * 60 * 1000);
        if (!limit.allowed) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        // Disabled accounts (set by an admin) can't sign in at all, but
        // the row and its data are kept — this is a suspension, not a
        // deletion.
        if (user.disabledAt) return null;

        user = await maybeBootstrapAdmin(user);

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        // Refreshed on every call (not just at sign-in) so a role change
        // reaches middleware's token-based admin gate without requiring
        // a fresh login — NextAuth re-signs this JWT's cookie on each
        // session touch (e.g. useSession()'s periodic /api/auth/session
        // fetch), so this stays reasonably current. It's still only a
        // fast pre-filter: the authoritative check is the live DB lookup
        // in the session() callback below and in lib/adminAuth.ts.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Refetched on every session check (not cached in the JWT) so a
        // just-clicked verification link, a role change, or an admin
        // disabling the account is reflected immediately without needing
        // to sign in again.
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { emailVerified: true, role: true, disabledAt: true },
        });
        session.user.emailVerified = user?.emailVerified ?? null;
        session.user.role = user?.role ?? "USER";
        session.user.disabled = !!user?.disabledAt;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
