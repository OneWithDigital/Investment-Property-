"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a reset link.">
      {submitted ? (
        <p className="text-sm text-slate-600 text-center">
          If an account exists for <strong>{email}</strong>, a reset link is on
          its way. Check your inbox (and check the server log if you're
          running this locally without SMTP configured).
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-slate-900 underline underline-offset-2">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
