"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (days > 0) return `${days}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return `just now`;
}

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [char, setChar] = useState<any | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);

  const [personas, setPersonas] = useState<any[]>([]);
  const [personaId, setPersonaId] = useState<string>(""); // "" = no persona

  const [starting, setStarting] = useState(false);

  // Chat history
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  function publicImageUrl(path: string | null) {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${base}/storage/v1/object/public/character-images/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  }

  async function loadAll() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);

    if (auth.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier,trial_ends_at,premium_ends_at")
        .eq("id", auth.user.id)
        .single();

      const ok = hasPremiumAccess(profile);
      setPremium(ok);

      if (ok) {
        const { data: pers } = await supabase
          .from("personas")
          .select("id,name")
          .order("created_at", { ascending: false });

        setPersonas(pers ?? []);
      } else {
        setPersonas([]);
      }
    } else {
      setPremium(false);
      setPersonas([]);
    }

    const { data: c, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setChar(null);
      setLoading(false);
      return;
    }

    setChar(c);
    setLoading(false);
  }

  async function loadChats() {
    if (!userId || !char?.id) {
      setChats([]);
      return;
    }
    setChatsLoading(true);
    const { data, error } = await supabase
      .from("chats")
      .select("id,created_at,persona_id,title")
      .eq("user_id", userId)
      .eq("character_id", char.id)
      .order("created_at", { ascending: false });

    if (error) {
      setChats([]);
      setChatsLoading(false);
      return;
    }

    setChats(data ?? []);
    setChatsLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!userId || !char?.id) return;
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, char?.id]);

  async function startNewChat() {
    if (!userId) {
      alert("Please sign in first.");
      router.push("/auth/signin");
      return;
    }
    if (!char?.id) return;

    setStarting(true);

    const payload: any = {
      user_id: userId,
      character_id: char.id,
      title: char.name ?? "Chat",
      persona_id: personaId || null,
    };

    const { data, error } = await supabase
      .from("chats")
      .insert(payload)
      .select("id")
      .single();

    setStarting(false);

    if (error) return alert(error.message);

    // refresh list + go to new chat
    await loadChats();
    router.push(`/chat/${data.id}`);
  }

  async function openChat(chatId: string) {
    router.push(`/chat/${chatId}`);
  }

  async function deleteChat(chatId: string) {
    const ok = confirm("Delete this chat? This removes the whole conversation.");
    if (!ok) return;

    setDeletingChatId(chatId);
    const res = await fetch("/api/chat/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId }),
    });
    const json = await res.json();
    setDeletingChatId(null);

    if (!res.ok) return alert(json?.error ?? "delete_failed");
    await loadChats();
  }

  if (loading) {
    return (
      <div className="card p-10">
        <div className="text-zinc-300">Loading character...</div>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="card p-10">
        <div className="text-zinc-200 font-semibold">Character not found</div>
        <Link className="btn-ghost inline-flex mt-4" href="/characters">
          Back to Public Characters
        </Link>
      </div>
    );
  }

  const img = publicImageUrl(char.image_path);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/characters" className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10">
          ←
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">{char.name}</h1>
          <p className="text-sm text-zinc-400 mt-1">{char.description || " "}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* LEFT */}
        <div className="card p-5 space-y-5">
          <div className="aspect-[4/5] rounded-2xl border border-white/10 bg-white/5 overflow-hidden grid place-items-center">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={char.name} className="h-full w-full object-cover" />
            ) : (
              <div className="text-zinc-400 text-sm">No image</div>
            )}
          </div>

          {/* PERSONA PICKER */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">Chat as persona</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Premium/Admin can choose a persona per chat.
                </div>
              </div>

              {!premium && (
                <Link href="/upgrade" className="btn-primary px-4 py-2 rounded-2xl">
                  Upgrade
                </Link>
              )}
            </div>

            <div className="mt-3">
              <select
                className="input"
                value={personaId}
                onChange={(e) => setPersonaId(e.target.value)}
                disabled={!premium}
              >
                <option value="">No persona (default)</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {premium && personas.length === 0 && (
                <div className="text-xs text-zinc-400 mt-2">
                  You have no personas yet. Create one in{" "}
                  <Link className="underline" href="/profile/personas">Profile → Personas</Link>.
                </div>
              )}
            </div>
          </div>

          {/* START NEW CHAT */}
          <button
            className="btn-primary w-full py-3 rounded-2xl disabled:opacity-60"
            onClick={startNewChat}
            disabled={starting}
          >
            {starting ? "Starting..." : "Start new chat"}
          </button>

          {/* CHAT HISTORY */}
          {userId && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Chat history</div>
                <button
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm"
                  onClick={loadChats}
                  disabled={chatsLoading}
                >
                  Refresh
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {chatsLoading && <div className="text-sm text-zinc-400">Loading...</div>}

                {!chatsLoading && chats.length === 0 && (
                  <div className="text-sm text-zinc-400">No chats yet. Start one above.</div>
                )}

                {!chatsLoading &&
                  chats.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2"
                    >
                      <button
                        className="flex-1 text-left"
                        onClick={() => openChat(c.id)}
                      >
                        <div className="text-sm font-medium truncate">
                          {c.title?.trim?.() ? c.title : "Chat"}
                        </div>
                        <div className="text-xs text-zinc-400">{timeAgo(c.created_at)}</div>
                      </button>

                      <button
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm"
                        onClick={() => openChat(c.id)}
                      >
                        Open
                      </button>

                      <button
                        className="px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15 text-sm disabled:opacity-60"
                        onClick={() => deleteChat(c.id)}
                        disabled={deletingChatId === c.id}
                      >
                        {deletingChatId === c.id ? "..." : "Delete"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="card p-6 space-y-4">
          <div>
            <div className="text-sm text-amber-300">✦ Personality / Scenario</div>
            <div className="mt-2 whitespace-pre-wrap text-zinc-200 leading-relaxed">
              {char.personality}
            </div>
          </div>

          {char.greeting && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-zinc-400">Greeting</div>
              <div className="mt-1 whitespace-pre-wrap text-zinc-200">{char.greeting}</div>
            </div>
          )}

          {char.example_dialogue && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-zinc-400">Example dialogue</div>
              <div className="mt-1 whitespace-pre-wrap text-zinc-200">{char.example_dialogue}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
