"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

/**
 * If an admin disables this account after the browser already has an
 * active session, the JWT itself doesn't change (NextAuth sessions are
 * stateless), but `session.user.disabled` is refetched from the DB on
 * every session check — so this catches it on the next poll/focus and
 * forces a sign-out rather than leaving a disabled account logged in.
 */
export function useSignOutIfDisabled() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.disabled) {
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.user?.disabled]);
}
