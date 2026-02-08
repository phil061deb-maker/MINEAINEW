"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getImageSrc } from "@/lib/images";

type HomeCharacter = {
  id: string;
  name: string;
  description: string | null;
  image_path: string | null;
};

function StepCard({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/35 backdrop-blur-xl p-6 hover:bg-black/45 transition">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 grid place-items-center">
          <span className="text-amber-200 font-black">{n}</span>
        </div>
        <div className="text-lg font-bold">{title}</div>
      </div>
      <p className="mt-3 text-zinc-300 leading-relaxed">{text}</p>
    </div>
  );
}

function TierCard({
  label,
  price,
  kicker,
  bullets,
  ctaLabel,
  ctaHref,
  accent,
  small,
}: {
  label: string;
  price: string;
  kicker: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  accent?: "amber" | "emerald";
  small?: boolean;
}) {
  const border =
    accent === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10"
      : "border-amber-500/25 bg-amber-500/10";
  const badge =
    accent === "emerald"
      ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-200"
      : "bg-amber-500/15 border-amber-500/25 text-amber-200";

  return (
    <div className={`rounded-[24px] border ${border} p-6`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-300">{label}</div>
        <div className={`px-3 py-1 rounded-full text-xs border ${badge}`}>{kicker}</div>
      </div>

      <div className={`${small ? "mt-2 text-3xl" : "mt-2 text-4xl"} font-black`}>{price}</div>

      <div className="mt-4 space-y-2 text-zinc-200">
        {bullets.map((b) => (
          <div key={b}>• {b}</div>
        ))}
      </div>

      <Link
        href={ctaHref}
        className={`mt-6 inline-flex w-full items-center justify-center px-5 py-3 rounded-2xl font-semibold ${
          accent === "emerald"
            ? "bg-emerald-500 text-black hover:bg-emerald-400"
            : "bg-amber-500 text-black hover:bg-amber-400"
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function picsumFallback(name: string) {
  const seed = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `https://picsum.photos/seed/${seed}/800/1000`;
}

export default function HomePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [chars, setChars] = useState<HomeCharacter[]>([]);
  const [loadingChars, setLoadingChars] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingChars(true);

      const { data, error } = await supabase
        .from("characters")
        .select("id,name,description,image_path,visibility,created_at")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.log("Home characters load error:", error.message);
        setChars([]);
        setLoadingChars(false);
        return;
      }

      setChars((data as any[]) ?? []);
      setLoadingChars(false);
    })();
  }, [supabase]);

  const preview = chars.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* SLIDER */}
      <HeroSlider />

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-3xl" />
          <div className="absolute -top-40 -right-48 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <div className="relative px-6 py-14 md:px-10 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2">
            <span className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center">
              <span className="text-amber-300 font-black">✦</span>
            </span>
            <span className="font-semibold tracking-wide">MineAI</span>
          </div>

          <h1 className="mt-8 text-4xl md:text-6xl font-black leading-tight">
            Create <span className="text-amber-400">Anyone.</span>
            <br />
            Chat <span className="text-amber-400">Anything.</span>
          </h1>

          <p className="mt-5 text-zinc-300 max-w-3xl mx-auto">
            Characters with attitude. Stories with heat. Comfort when you need it.
            Pick a character and let the story grab you.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/characters" className="px-6 py-3 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 font-semibold">
              Explore characters
            </Link>
            <Link href="/create" className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold">
              Create your own
            </Link>
          </div>
        </div>
      </section>

      {/* HOME STRIP (this is the part that was broken) */}
      <section className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">Pick your vibe</div>
            <div className="text-sm text-zinc-400 mt-1">A few characters to tempt you…</div>
          </div>
          <Link href="/characters" className="text-sm text-amber-200 hover:text-amber-100">
            View all →
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-2">
            {loadingChars && (
              <div className="text-zinc-400 text-sm px-2">Loading characters…</div>
            )}

            {!loadingChars && preview.length === 0 && (
              <div className="text-zinc-400 text-sm px-2">
                No public characters found yet.
              </div>
            )}

            {!loadingChars &&
              preview.map((c) => {
                // ✅ FIX: use getImageSrc so it works for FULL URLs AND bucket paths
                const img = getImageSrc(c.image_path) || picsumFallback(c.name);

                return (
                  <div
                    key={c.id}
                    className="w-[240px] rounded-[22px] border border-white/10 bg-black/40 overflow-hidden"
                  >
                    <div className="h-[150px] bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                    <div className="p-4">
                      <div className="font-semibold leading-snug line-clamp-2">{c.name}</div>
                      <div className="mt-1 text-sm text-zinc-400 line-clamp-2">
                        {c.description || "A character waiting to meet you."}
                      </div>
                      <Link
                        href={`/character/${c.id}`}
                        className="mt-3 inline-flex w-full items-center justify-center px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-sm"
                      >
                        Talk to this character
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-8 md:p-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
            <span className="text-amber-200">⚡</span> How MineAI works (dangerously easy)
          </div>

          <h2 className="mt-5 text-3xl md:text-4xl font-black">4 steps to obsession ✦</h2>
          <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
            No boring setup. Pick a character and let the story catch fire.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <StepCard n="1" title="Choose your character" text="Romance, fantasy, sci-fi, comfort, chaos — pick what you’re craving." />
          <StepCard n="2" title="Start the chat" text="Say one line… and the character comes alive. The story moves with you." />
          <StepCard n="3" title="Create your own characters" text="Make them sweet, savage, protective, flirty… whatever your heart wants." />
          <StepCard n="4" title="Go Premium (optional… but addictive)" text="Unlock personas, unlimited chats, private characters, and AI tools." />
        </div>
      </section>

      {/* FREE vs PREMIUM */}
      <section className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">Try Free, then level up</div>
            <div className="text-sm text-zinc-400 mt-1">
              Free lets you taste it. Premium makes it impossible to leave.
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            <span className="font-black">★</span>
            Premium: $10/mo or $80/yr <span className="text-amber-200/80">(save $40)</span>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <TierCard
            label="Free"
            price="$0"
            kicker="Start here"
            bullets={["Create & chat with characters", "Daily message limit", "Public characters", "Chat history saved"]}
            ctaLabel="Start free"
            ctaHref="/auth/signup"
            accent="emerald"
          />

          <TierCard
            label="Premium"
            price="$10/mo"
            kicker="Most popular"
            bullets={["Personas", "Unlimited chats", "Private characters", "AI helper for personalities", "AI images"]}
            ctaLabel="Go Premium"
            ctaHref="/upgrade"
            accent="amber"
            small
          />
        </div>
      </section>
    </div>
  );
}
