"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

function hasPremiumAccess(profile: any) {
  const tier = profile?.tier ?? "free";
  if (tier === "admin" || tier === "premium") return true;

  const now = new Date();
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const premiumEnds = profile?.premium_ends_at ? new Date(profile.premium_ends_at) : null;

  if (trialEnds && trialEnds > now) return true;
  if (premiumEnds && premiumEnds > now) return true;

  return false;
}

export default function PersonasPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setPremium(false);
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier,trial_ends_at,premium_ends_at")
      .eq("id", auth.user.id)
      .single();

    const ok = hasPremiumAccess(profile);
    setPremium(ok);

    if (ok) {
      const { data } = await supabase
        .from("personas")
        .select("id,name,description,created_at")
        .order("created_at", { ascending: false });

      setItems(data ?? []);
    } else {
      setItems([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPersona() {
    if (!name.trim() || !desc.trim()) return alert("Name + description required.");
    if (!premium) return;

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return alert("Please sign in.");
    }

    const { error } = await supabase.from("personas").insert({
      user_id: auth.user.id,
      name: name.trim(),
      description: desc.trim(),
    });

    setSaving(false);
    if (error) return alert(error.message);

    setName("");
    setDesc("");
    load();
  }

  async function deletePersona(id: string) {
    const ok = confirm("Delete this persona?");
    if (!ok) return;

    const { error } = await supabase.from("personas").delete().eq("id", id);
    if (error) return alert(error.message);

    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10">←</Link>
          <div>
            <h1 className="text-3xl font-semibold">Personas</h1>
            <p className="text-sm text-zinc-400 mt-1">Premium/Admin: unlimited personas</p>
          </div>
        </div>

        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>

      {!loading && !premium && (
        <div className="rounded-[24px] border border-amber-500/25 bg-amber-500/10 p-6">
          <div className="text-amber-200 font-semibold">Premium required</div>
          <div className="text-sm text-zinc-300 mt-2">
            Personas let you chat “as someone else” (roleplay identity), and choose a persona per chat.
          </div>
          <Link href="/upgrade" className="btn-primary inline-flex mt-4 px-6 py-3 rounded-2xl">
            Upgrade
          </Link>
        </div>
      )}

      {premium && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <div className="text-lg font-semibold">Create persona</div>

            <div>
              <div className="label mb-1">Persona name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Philip 'The Explorer'" />
            </div>

            <div>
              <div className="label mb-1">Description</div>
              <textarea className="input min-h-[140px]" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Background, tone, behavior, relationship style..." />
            </div>

            <button className="btn-primary w-full py-3 rounded-2xl" onClick={createPersona} disabled={saving}>
              {saving ? "Creating..." : "Create Persona"}
            </button>
          </div>

          <div className="card p-6">
            <div className="text-lg font-semibold">Your personas</div>
            <div className="text-sm text-zinc-400 mt-1">{items.length ? "" : "None yet."}</div>

            <div className="mt-4 space-y-3">
              {items.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{p.description}</div>
                    </div>
                    <button className="btn-ghost" onClick={() => deletePersona(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
