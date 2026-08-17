"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-rose-600 text-center">
        Missing reset token. Use the link from your password reset email.
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-sm text-slate-600 text-center">
        Password updated. Redirecting you to log in…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">New password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="text-xs text-slate-400">At least 8 characters.</span>
      </label>
      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" subtitle="Choose a new password for your account.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-slate-900 underline underline-offset-2">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
