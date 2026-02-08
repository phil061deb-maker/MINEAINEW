"use client";

import { useEffect, useState } from "react";
import { NsfwGateModal } from "@/components/nsfw/NsfwGateModal";

type Me = {
  loggedIn: boolean;
  email?: string | null;
  displayName?: string | null;
  tier?: string;
  trial_ends_at?: string | null;
  premium_ends_at?: string | null;
  is_blocked?: boolean;
  is_18_confirmed?: boolean;
  nsfw_enabled?: boolean;
};

function fmt(date?: string | null) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [is18, setIs18] = useState(false);
  const [nsfw, setNsfw] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  async function loadMe() {
    setLoading(true);

    const res = await fetch("/api/me", { cache: "no-store" });
    const json = await res.json();

    setMe(json);
    setIs18(!!json.is_18_confirmed);
    setNsfw(!!json.nsfw_enabled);

    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);

    const res = await fetch("/api/profile/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_18_confirmed: is18,
        nsfw_enabled: nsfw,
      }),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(json?.error ?? "Failed to save settings");
      return;
    }

    await loadMe();
    alert("Settings saved ✅");
  }

  useEffect(() => {
    loadMe();
  }, []);

  if (loading) {
    return <div className="text-zinc-400">Loading profile…</div>;
  }

  if (!me?.loggedIn) {
    return <div className="text-zinc-400">Please sign in.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* NSFW MODAL */}
      <NsfwGateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial18={!!me.is_18_confirmed}
        initialNsfw={!!me.nsfw_enabled}
        onSaved={(next18, nextNsfw) => {
          // Keep UI in sync after saving in modal
          setIs18(next18);
          setNsfw(nextNsfw);
          setMe((prev) =>
            prev ? { ...prev, is_18_confirmed: next18, nsfw_enabled: nextNsfw } : prev
          );
        }}
      />

      {/* HEADER */}
      <div className="card p-6">
        <h1 className="text-3xl font-semibold">Your Profile</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your account, subscription, and content preferences.
        </p>
      </div>

      {/* ACCOUNT INFO */}
      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>

        <div>
          <div className="text-xs text-zinc-500">Email</div>
          <div className="font-medium">{me.email ?? "—"}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Tier</div>
          <div className="font-medium capitalize">{me.tier ?? "free"}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Trial ends</div>
          <div>{fmt(me.trial_ends_at)}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Premium ends</div>
          <div>{fmt(me.premium_ends_at)}</div>
        </div>

        {me.is_blocked && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-200">
            Your account is currently blocked. Please contact support.
          </div>
        )}
      </div>

      {/* NSFW SETTINGS */}
      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">NSFW Access</h2>
            <p className="text-sm text-zinc-400 mt-1">
              You must confirm 18+ and save before NSFW chats are allowed.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
          >
            Open Popup
          </button>
        </div>

        {/* 18+ */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={is18}
            onChange={(e) => {
              const value = e.target.checked;
              setIs18(value);
              if (!value) setNsfw(false);
            }}
          />

          <div>
            <div className="font-medium">I confirm that I am 18 years or older</div>
            <div className="text-sm text-zinc-400">
              Required before enabling NSFW chats.
            </div>
          </div>
        </label>

        {/* NSFW toggle */}
        <label className={`flex items-start gap-3 ${!is18 ? "opacity-40 pointer-events-none" : ""}`}>
          <input
            type="checkbox"
            className="mt-1"
            checked={nsfw}
            disabled={!is18}
            onChange={(e) => setNsfw(e.target.checked)}
          />

          <div>
            <div className="font-medium">Enable NSFW characters & chats</div>
            <div className="text-sm text-zinc-400">You MUST save after changing this.</div>
          </div>
        </label>

        <button onClick={saveSettings} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Settings"}
        </button>

        <div className="text-xs text-zinc-500">
          Current: 18+ = {me.is_18_confirmed ? "Yes" : "No"} • NSFW ={" "}
          {me.nsfw_enabled ? "Enabled" : "Disabled"}
        </div>
      </div>
    </div>
  );
}
