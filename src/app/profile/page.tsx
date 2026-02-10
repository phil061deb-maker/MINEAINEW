"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Persona = { id: string; name: string; description: string | null; created_at: string };

function hasPremiumAccess(profile: any) {
  const tier = profile?.tier ?? "free";
  if (tier === "admin" || tier === "premium") return true;

  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const premiumEnds = profile?.premium_ends_at ? new Date(profile.premium_ends_at) : null;

  const now = new Date();
  if (trialEnds && trialEnds > now) return true;
  if (premiumEnds && premiumEnds > now) return true;

  return false;
}

export default function ProfilePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [over18, setOver18] = useState(false);
  const [allowNsfw, setAllowNsfw] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [creatingPersona, setCreatingPersona] = useState(false);

  const premiumAccess = hasPremiumAccess(profile);

  async function loadAll() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/auth/signin";
      return;
    }

    const { data: p } = await supabase
      .from("profiles")
      .select("id,email,tier,trial_ends_at,premium_ends_at,display_name,bio,over18,allow_nsfw")
      .eq("id", auth.user.id)
      .single();

    setProfile(p ?? null);
    setDisplayName(p?.display_name ?? "");
    setBio(p?.bio ?? "");
    setOver18(Boolean(p?.over18));
    setAllowNsfw(Boolean(p?.allow_nsfw));

    // personas
    const res = await fetch("/api/personas/list", { cache: "no-store" });
    const json = await res.json();
    if (res.ok) setPersonas(Array.isArray(json.personas) ? json.personas : []);
    else setPersonas([]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setSaving(true);
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        bio,
        over18,
        allow_nsfw: allowNsfw,
      }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) return alert(json?.error ?? "save_failed");

    // refresh local state from response
    setOver18(Boolean(json.over18));
    setAllowNsfw(Boolean(json.allow_nsfw));

    alert("✅ Saved!");
    await loadAll();
  }

  async function createPersona() {
    const name = pName.trim();
    if (!name) return alert("Persona name required.");

    setCreatingPersona(true);
    const res = await fetch("/api/personas/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: pDesc }),
    });
    const json = await res.json();
    setCreatingPersona(false);

    if (!res.ok) return alert(json?.error ?? "persona_create_failed");

    setPName("");
    setPDesc("");
    await loadAll();
  }

  if (loading) {
    return (
      <div className="card p-10">
        <div className="text-zinc-300">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-zinc-400">Your account</div>
            <div className="text-xl font-semibold">{profile?.email ?? "—"}</div>
            <div className="text-sm text-zinc-400 mt-1">
              Tier: <span className="text-zinc-200">{profile?.tier ?? "free"}</span>
              {premiumAccess ? " • Premium Active" : ""}
            </div>
          </div>

          <button
            className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6 space-y-4">
          <div className="text-lg font-semibold">Profile info</div>

          <div>
            <div className="label mb-1">Display name</div>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Philip"
            />
          </div>

          <div>
            <div className="label mb-1">Bio</div>
            <textarea
              className="input min-h-[120px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people who you are..."
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <label className="flex items-center gap-3 text-sm text-zinc-200">
              <input type="checkbox" checked={over18} onChange={(e) => setOver18(e.target.checked)} />
              I confirm I am 18+
            </label>

            <label className="flex items-center gap-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={allowNsfw}
                onChange={(e) => setAllowNsfw(e.target.checked)}
                disabled={!premiumAccess || !over18}
              />
              Allow NSFW content (Premium only)
            </label>

            {!premiumAccess && (
              <div className="text-xs text-amber-300">
                🔒 NSFW is only available for Premium/Admin users.
              </div>
            )}
            {premiumAccess && !over18 && (
              <div className="text-xs text-amber-300">
                ⚠️ Turn on “I am 18+” to enable NSFW.
              </div>
            )}
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-primary w-full py-3 rounded-2xl text-base font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>

        <div className="card p-6 space-y-4">
          <div className="text-lg font-semibold">Personas</div>
          <div className="text-sm text-zinc-400">
            Personas are like “who you are” when chatting. You can pick one per chat.
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-sm font-semibold">Create a persona</div>

            <div>
              <div className="label mb-1">Persona name</div>
              <input className="input" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Liam" />
            </div>

            <div>
              <div className="label mb-1">Persona description</div>
              <textarea
                className="input min-h-[90px]"
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="Age, vibe, style, backstory..."
              />
            </div>

            <button
              onClick={createPersona}
              disabled={creatingPersona}
              className="px-4 py-2 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {creatingPersona ? "Creating..." : "Create persona"}
            </button>
          </div>

          <div className="space-y-3">
            {personas.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-zinc-300 whitespace-pre-wrap mt-1">{p.description || "—"}</div>
              </div>
            ))}
            {!personas.length && <div className="text-sm text-zinc-400">No personas yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
