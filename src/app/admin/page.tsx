"use client";

import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  tier: string;
  is_blocked: boolean;
  trial_ends_at: string | null;
  premium_ends_at: string | null;
  created_at: string | null;
};

function fmt(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/users/list", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load users");
      setUsers(json.users ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function doAction(userId: string, action: string, payload: Record<string, any> = {}) {
    setBusyId(userId);
    setErr(null);
    try {
      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Action failed");
      await loadUsers();
    } catch (e: any) {
      setErr(e?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const total = users.length;

  const stats = useMemo(() => {
    const premium = users.filter((u) => u.tier === "premium").length;
    const admin = users.filter((u) => u.tier === "admin").length;
    const blocked = users.filter((u) => u.is_blocked).length;
    return { premium, admin, blocked };
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Manage users: block/unblock, grant 3/7 day trials, set premium/free, revoke access.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">Total: {total}</span>
          <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">Premium: {stats.premium}</span>
          <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">Admins: {stats.admin}</span>
          <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">Blocked: {stats.blocked}</span>

          <button
            onClick={loadUsers}
            className="ml-auto px-4 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400"
          >
            Refresh
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="text-zinc-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="text-zinc-400">No users found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="text-zinc-400">
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pr-3">Email</th>
                  <th className="text-left py-3 pr-3">Tier</th>
                  <th className="text-left py-3 pr-3">Blocked</th>
                  <th className="text-left py-3 pr-3">Trial ends</th>
                  <th className="text-left py-3 pr-3">Premium ends</th>
                  <th className="text-left py-3 pr-3">Created</th>
                  <th className="text-left py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} className="border-b border-white/10">
                      <td className="py-4 pr-3">
                        <div className="font-medium text-zinc-100">{u.email ?? "—"}</div>
                        <div className="text-xs text-zinc-500">{u.id}</div>
                      </td>

                      <td className="py-4 pr-3">
                        <span className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
                          {u.tier ?? "free"}
                        </span>
                      </td>

                      <td className="py-4 pr-3">
                        {u.is_blocked ? (
                          <span className="px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200">
                            Yes
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300">
                            No
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-3 text-zinc-300">{fmt(u.trial_ends_at)}</td>
                      <td className="py-4 pr-3 text-zinc-300">{fmt(u.premium_ends_at)}</td>
                      <td className="py-4 pr-3 text-zinc-500">{fmt(u.created_at)}</td>

                      <td className="py-4 pr-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={busy}
                            onClick={() => doAction(u.id, "set_blocked", { blocked: !u.is_blocked })}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                          >
                            {u.is_blocked ? "Unblock" : "Block"}
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => doAction(u.id, "grant_trial", { days: 3 })}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                          >
                            Trial 3d
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => doAction(u.id, "grant_trial", { days: 7 })}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                          >
                            Trial 7d
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => doAction(u.id, "set_tier", { tier: "premium" })}
                            className="px-3 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400"
                          >
                            Make Premium
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => doAction(u.id, "set_tier", { tier: "free" })}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                          >
                            Make Free
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => doAction(u.id, "revoke_access")}
                            className="px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                          >
                            Revoke
                          </button>

                          {busy && <span className="text-xs text-zinc-500 self-center">Working…</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
