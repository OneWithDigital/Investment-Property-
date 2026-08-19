"use client";

import { useEffect, useState } from "react";

interface AdPlacement {
  id: string;
  type: "AFFILIATE_LINK" | "ADVERTISEMENT";
  slot: string;
  title: string;
  body: string | null;
  url: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

const EMPTY_FORM = {
  type: "AFFILIATE_LINK" as "AFFILIATE_LINK" | "ADVERTISEMENT",
  slot: "",
  title: "",
  body: "",
  url: "",
  imageUrl: "",
};

export default function AdminMonetizationPage() {
  const [placements, setPlacements] = useState<AdPlacement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/admin/ad-placements");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load placements.");
        return;
      }
      setPlacements(json.placements);
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.slot.trim() || !form.title.trim() || !form.url.trim()) {
      setError("Slot, title, and URL are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ad-placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't create placement.");
        return;
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/ad-placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setPlacements((prev) => prev?.map((p) => (p.id === id ? { ...p, active } : p)) ?? null);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this placement?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/ad-placements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlacements((prev) => prev?.filter((p) => p.id !== id) ?? null);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Monetization</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Reserved for affiliate links and advertisements. This manages the data only — nothing in the app
          renders these yet, so creating one here has no visible effect until a display slot is built.
          New placements default to inactive.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-bold text-slate-900">Add placement</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AdPlacement["type"] })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="AFFILIATE_LINK">Affiliate link</option>
              <option value="ADVERTISEMENT">Advertisement</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Slot (free text, e.g. results-footer)
            <input
              value={form.slot}
              onChange={(e) => setForm({ ...form, slot: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-2">
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-2">
            Body / description (optional)
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Destination URL
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Image URL (optional)
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add placement"}
        </button>
      </form>

      {placements && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.title}</div>
                    <div className="truncate text-xs text-slate-500 max-w-xs">{p.url}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.type === "AFFILIATE_LINK" ? "Affiliate link" : "Advertisement"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{p.slot}</code>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={busyId === p.id}
                      onClick={() => toggleActive(p.id, !p.active)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                        p.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={busyId === p.id}
                      onClick={() => handleDelete(p.id)}
                      className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {placements.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No placements yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
