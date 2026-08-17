import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { rateLimit } from "./rateLimit";

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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Refetched on every session check (not cached in the JWT) so a
        // just-clicked verification link is reflected immediately.
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { emailVerified: true },
        });
        session.user.emailVerified = user?.emailVerified ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
