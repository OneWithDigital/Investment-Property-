"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string;
  savedAnalysesCount: number;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load users.");
        return;
      }
      setUsers(json.users);
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function updateUser(id: string, data: { role?: "USER" | "ADMIN"; disabled?: boolean }) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Update failed.");
        return;
      }
      setUsers((prev) => prev?.map((u) => (u.id === id ? { ...u, ...json } : u)) ?? null);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(id: string, email: string) {
    if (!window.confirm(`Delete ${email}? This permanently deletes their account and saved analyses.`)) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Delete failed.");
        return;
      }
      setUsers((prev) => prev?.filter((u) => u.id !== id) ?? null);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          {users ? `${users.length} account${users.length === 1 ? "" : "s"}` : "Loading…"}
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {users && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Analyses</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === session?.user?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name || "—"}</div>
                      <div className="text-xs text-slate-500">
                        {u.email} {u.emailVerified ? "" : "(unverified)"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.role === "ADMIN" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.disabled ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {u.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{u.savedAnalysesCount}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-slate-400">(you)</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={busyId === u.id}
                            onClick={() => updateUser(u.id, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {u.role === "ADMIN" ? "Revoke admin" : "Make admin"}
                          </button>
                          <button
                            disabled={busyId === u.id}
                            onClick={() => updateUser(u.id, { disabled: !u.disabled })}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {u.disabled ? "Enable" : "Disable"}
                          </button>
                          <button
                            disabled={busyId === u.id}
                            onClick={() => deleteUser(u.id, u.email)}
                            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
