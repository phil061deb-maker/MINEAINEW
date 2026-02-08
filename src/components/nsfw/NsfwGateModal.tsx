"use client";

import { useState } from "react";

export function NsfwGateModal({
  open,
  onClose,
  initial18,
  initialNsfw,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial18: boolean;
  initialNsfw: boolean;
  onSaved: (next18: boolean, nextNsfw: boolean) => void;
}) {
  const [is18, setIs18] = useState(initial18);
  const [nsfw, setNsfw] = useState(initialNsfw);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_18_confirmed: is18,
        nsfw_enabled: nsfw,
      }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(json?.error ?? "Failed to save");
      return;
    }

    onSaved(!!json.is_18_confirmed, !!json.nsfw_enabled);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-black/85 backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">NSFW Access</div>
            <div className="text-sm text-zinc-400 mt-1">
              You must confirm 18+ and save before NSFW chats are allowed.
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={is18}
              onChange={(e) => {
                const v = e.target.checked;
                setIs18(v);
                if (!v) setNsfw(false);
              }}
            />
            <div>
              <div className="font-medium">I confirm I am 18+ years old</div>
              <div className="text-sm text-zinc-400">Required for NSFW content.</div>
            </div>
          </label>

          <label className={`flex items-start gap-3 ${!is18 ? "opacity-40 pointer-events-none" : ""}`}>
            <input
              type="checkbox"
              className="mt-1"
              checked={nsfw}
              disabled={!is18}
              onChange={(e) => setNsfw(e.target.checked)}
            />
            <div>
              <div className="font-medium">Enable NSFW chats</div>
              <div className="text-sm text-zinc-400">You can disable any time.</div>
            </div>
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
            By enabling NSFW you agree you are legally allowed to view adult content in your region.
            MineAI does not allow illegal content or minors.
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full px-4 py-3 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 font-semibold"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
