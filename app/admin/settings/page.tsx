"use client";

import { useEffect, useState } from "react";

interface Setting {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => setSettings(json.settings))
      .catch(() => setError("Couldn't reach the server."));
  }, []);

  async function toggle(key: string, value: boolean) {
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Update failed.");
        return;
      }
      setSettings((prev) => prev?.map((s) => (s.key === key ? { ...s, value } : s)) ?? null);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm max-w-2xl text-slate-500">
          App-level toggles, stored in the database. API keys and other secrets aren&apos;t managed here —
          those live in environment variables (see the Overview tab for what&apos;s configured, and the README
          for how to set them).
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {settings && (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {settings.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <div className="text-sm font-medium text-slate-900">{s.label}</div>
                <div className="text-xs text-slate-500">{s.description}</div>
              </div>
              <button
                role="switch"
                aria-checked={s.value}
                disabled={busyKey === s.key}
                onClick={() => toggle(s.key, !s.value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  s.value ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    s.value ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
