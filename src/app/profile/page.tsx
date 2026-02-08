"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Tab = "Overview" | "Characters" | "Personas" | "Settings";

const ADMIN_EMAIL = "pdebeer435@gmail.com";

/**
 * TEMP USER (Phase 1 UI)
 * Phase 2 will replace with Supabase session + DB profile.
 */
const MOCK_LOGGED_IN = true; // set false to see "Please sign in" state
const MOCK_EMAIL = "pdebeer435@gmail.com"; // change to test normal user

type Persona = { id: string; name: string; description: string };

export default function ProfilePage() {
  const session = useMemo(() => {
    const loggedIn = MOCK_LOGGED_IN;
    const email = loggedIn ? MOCK_EMAIL : null;
    const isAdmin = email === ADMIN_EMAIL;
    const tier = isAdmin ? "Admin" : "Free";
    return { loggedIn, email, isAdmin, tier };
  }, []);

  const [tab, setTab] = useState<Tab>("Overview");

  const [displayName, setDisplayName] = useState("Philip De Beer");
  const [confirm18, setConfirm18] = useState(false);
  const [enableNsfw, setEnableNsfw] = useState(false);

  const [personaName, setPersonaName] = useState("");
  const [personaDesc, setPersonaDesc] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);

  function saveSettings() {
    alert("Settings save will be real in Phase 2 (Supabase).");
  }

  function createPersona() {
    if (!personaName.trim() || !personaDesc.trim()) {
      alert("Please add persona name + description.");
      return;
    }
    const p: Persona = {
      id: crypto.randomUUID(),
      name: personaName.trim(),
      description: personaDesc.trim(),
    };
    setPersonas((x) => [p, ...x]);
    setPersonaName("");
    setPersonaDesc("");
  }

  function deletePersona(id: string) {
    setPersonas((x) => x.filter((p) => p.id !== id));
  }

  if (!session.loggedIn) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-zinc-400 mt-2">Please sign in to view your profile.</p>
        <div className="mt-6 flex gap-2">
          <Link className="btn-ghost" href="/auth/signin">Sign in</Link>
          <Link className="btn-primary" href="/auth/signup">Sign up</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP PROFILE CARD */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-3xl" />
          <div className="absolute -top-40 -right-48 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-2xl">
              👤
            </div>

            <div>
              <div className="text-2xl font-semibold">{displayName}</div>
              <div className="text-sm text-zinc-400">{session.email}</div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-zinc-200">
                Tier: <span className="font-semibold text-amber-300">{session.tier}</span>
                {session.isAdmin && <span className="text-emerald-300">• Admin perks enabled</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn-primary" href="/create">Create Character</Link>
            <Link className="btn-ghost" href="/my-characters">My Characters</Link>
            <button
              className="btn-ghost"
              onClick={() => alert("Logout will be real in Phase 2 (Supabase).")}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex flex-wrap gap-2">
        {(["Overview", "Characters", "Personas", "Settings"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                active
                  ? "px-5 py-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/15 text-amber-200"
                  : "px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              }
            >
              {t}
            </button>
          );
        })}
        <div className="ml-auto">
          {session.tier === "Free" ? (
            <Link className="btn-primary" href="/profile?upgrade=1">Upgrade</Link>
          ) : (
            <button className="btn-ghost" onClick={() => alert("Billing settings in Phase 4")}>
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT */}
      {tab === "Overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="text-sm text-zinc-400 mt-2">
              Quick stats and shortcuts (real data in Phase 2).
            </p>

            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-zinc-400">Messages (30 days)</div>
                <div className="text-2xl font-semibold mt-2">—</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-zinc-400">Characters</div>
                <div className="text-2xl font-semibold mt-2">—</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-zinc-400">Personas</div>
                <div className="text-2xl font-semibold mt-2">{personas.length}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary" href="/characters">Explore Public Characters</Link>
              <Link className="btn-ghost" href="/create">Create a Character</Link>
              <Link className="btn-ghost" href="/chat/test">Open a Chat</Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Account</h3>
            <p className="text-sm text-zinc-400 mt-2">
              Email verification + subscriptions in Phase 2/4.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Email verified</span>
                <span className="text-emerald-300">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">NSFW enabled</span>
                <span className="text-zinc-200">{enableNsfw ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">18+ confirmed</span>
                <span className="text-zinc-200">{confirm18 ? "Yes" : "No"}</span>
              </div>
            </div>

            <button className="btn-primary w-full mt-6" onClick={() => setTab("Settings")}>
              Open Settings
            </button>
          </div>
        </div>
      )}

      {tab === "Characters" && (
        <div className="card p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Your Characters</h2>
              <p className="text-sm text-zinc-400 mt-1">This will show your characters from Supabase (Phase 2).</p>
            </div>
            <Link className="btn-primary" href="/create">+ Create Character</Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
            No characters loaded yet (UI only).
          </div>
        </div>
      )}

      {tab === "Personas" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create persona */}
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Create Persona</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Free: 1 persona • Premium/Admin: unlimited (enforced in Phase 2).
              </p>
            </div>

            <div>
              <div className="label mb-1">Persona name</div>
              <input
                className="input"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                placeholder='e.g., "Philip — The Explorer"'
              />
            </div>

            <div>
              <div className="label mb-1">Persona description</div>
              <textarea
                className="input min-h-[160px]"
                value={personaDesc}
                onChange={(e) => setPersonaDesc(e.target.value)}
                placeholder="Describe this persona: background, tone, boundaries, preferences…"
              />
            </div>

            <button className="btn-primary w-full py-3 rounded-2xl" onClick={createPersona}>
              Create Persona
            </button>
          </div>

          {/* Personas list */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Personas</h2>
              <button className="btn-ghost" onClick={() => alert("Refresh from DB in Phase 2")}>
                Refresh
              </button>
            </div>

            {personas.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
                No personas yet.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {personas.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{p.description}</div>
                      </div>
                      <button className="btn-ghost" onClick={() => deletePersona(p.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "Settings" && (
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Profile settings + safety controls (saved in Phase 2).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="label mb-1">Display name</div>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <div className="label mb-1">Email</div>
              <input className="input" value={session.email ?? ""} disabled />
              <div className="text-xs text-zinc-500 mt-1">
                Changing email requires verification (Phase 2).
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-semibold">NSFW settings (18+)</div>
            <div className="text-sm text-zinc-400 mt-1">
              NSFW characters remain hidden unless enabled. Premium will be required for NSFW access (Phase 2).
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={confirm18}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setConfirm18(v);
                    if (!v) setEnableNsfw(false);
                  }}
                />
                I confirm I am 18 or older
              </label>

              <label className="flex items-center gap-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={enableNsfw}
                  disabled={!confirm18}
                  onChange={(e) => setEnableNsfw(e.target.checked)}
                />
                Enable NSFW characters
              </label>

              {!confirm18 && (
                <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  Confirm 18+ to unlock the NSFW toggle.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" onClick={saveSettings}>Save settings</button>
            {session.tier !== "Admin" && (
              <button className="btn-ghost" onClick={() => alert("Cancel Premium (Phase 4)")}>
                Cancel Premium
              </button>
            )}
            <button className="btn-ghost" onClick={() => alert("Delete profile (Phase 2)")}>
              Delete profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
