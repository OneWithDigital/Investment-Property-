"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function VerifyEmailBanner() {
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!session?.user || session.user.emailVerified || dismissed) return null;

  async function handleResend() {
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-center gap-3">
      <span>
        {sent
          ? "Verification email sent — check your inbox."
          : "Please verify your email address."}
      </span>
      {!sent && (
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="font-medium underline underline-offset-2 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Resend verification email"}
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-700"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
