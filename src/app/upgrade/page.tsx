"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
async function startSubscription(plan: "monthly" | "yearly") {
  try {
    const res = await fetch("/api/paypal/subscription/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const json = await res.json();

    if (!json?.approveUrl) {
      alert("Failed to start subscription");
      return;
    }

    // Redirect user to PayPal checkout
    window.location.href = json.approveUrl;

  } catch (err) {
    console.error(err);
    alert("Subscription error");
  }
}

type Me =
  | { loggedIn: false }
  | { loggedIn: true; email: string | null; displayName: string | null; tier: "free" | "premium" | "admin" | string };

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

export default function UpgradePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [me, setMe] = useState<Me>({ loggedIn: false });
  const [loading, setLoading] = useState(true);

  const [premiumActive, setPremiumActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [premiumEndsAt, setPremiumEndsAt] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);

    const res = await fetch("/api/me", { cache: "no-store" });
    const json = (await res.json()) as Me;
    setMe(json);

    if (json.loggedIn) {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tier,trial_ends_at,premium_ends_at")
          .eq("id", uid)
          .single();

        setPremiumActive(hasPremiumAccess(profile));
        setTrialEndsAt(profile?.trial_ends_at ?? null);
        setPremiumEndsAt(profile?.premium_ends_at ?? null);
      }
    } else {
      setPremiumActive(false);
      setTrialEndsAt(null);
      setPremiumEndsAt(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      await refresh();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fmtDate(v: string | null) {
    if (!v) return null;
    try {
      return new Date(v).toLocaleString();
    } catch {
      return v;
    }
  }

  async function startPaypal(which: "monthly" | "yearly") {
    const res = await fetch("/api/paypal/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: which }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert("PayPal error: " + (json?.error ?? "unknown"));
      console.log(json);
      return;
    }

    if (json?.approveUrl) {
      window.location.href = json.approveUrl;
    } else {
      alert("PayPal did not return an approval URL.");
      console.log(json);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-xl p-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-3xl" />
          <div className="absolute -top-40 -right-48 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2">
            <span className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center">
              <span className="text-amber-300 font-black">✦</span>
            </span>
            <span className="font-semibold tracking-wide">MineAI</span>
          </div>

          <h1 className="mt-6 text-3xl md:text-5xl font-black">
            Upgrade to <span className="text-amber-400">Premium</span>
          </h1>

          <p className="mt-3 text-zinc-300 max-w-2xl mx-auto">
            Personas, unlimited chats, private characters, AI creation tools, and more.
          </p>

          {!loading && me.loggedIn && (
            <div className="mt-6 inline-flex flex-col items-center gap-2 text-sm">
              <div className="text-zinc-300">
                Logged in as <span className="text-amber-200 font-semibold">{me.email ?? "Account"}</span>
              </div>

              {premiumActive ? (
                <div className="px-4 py-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
                  ✅ Premium access is active
                  {premiumEndsAt ? <div className="text-xs mt-1 opacity-80">Ends: {fmtDate(premiumEndsAt)}</div> : null}
                  {!premiumEndsAt && trialEndsAt ? (
                    <div className="text-xs mt-1 opacity-80">Trial ends: {fmtDate(trialEndsAt)}</div>
                  ) : null}
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-zinc-200">
                  You’re on Free right now.
                </div>
              )}
            </div>
          )}

          {!loading && !me.loggedIn && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link className="px-5 py-3 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 font-semibold" href="/auth/signup">
                Create account
              </Link>
              <Link className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200" href="/auth/signin">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-10">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-[24px] border border-white/10 bg-black/40 p-6">
            <div className="text-sm text-zinc-400">Monthly</div>
            <div className="mt-2 text-4xl font-black">
              $10<span className="text-base text-zinc-400 font-semibold">/mo</span>
            </div>

            <div className="mt-5 space-y-2 text-zinc-200">
              <div>• Personas (chat as a persona)</div>
              <div>• Unlimited chats</div>
              <div>• Private characters</div>
              <div>• AI helper for personality generation</div>
              <div>• AI character image generation (Premium/Admin)</div>
            </div>

            <button
  onClick={() => startSubscription("monthly")}
  className="btn-primary w-full"
>
  Subscribe Monthly — $10
</button>

          </div>

          <div className="rounded-[24px] border border-amber-500/25 bg-amber-500/10 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-amber-200">Yearly</div>
              <div className="px-3 py-1 rounded-full text-xs bg-amber-500/20 border border-amber-500/25 text-amber-200">
                Save $40
              </div>
            </div>

            <div className="mt-2 text-4xl font-black">
              $80<span className="text-base text-amber-200/80 font-semibold">/yr</span>
            </div>
            <div className="mt-1 text-sm text-amber-200/80">You save $40 vs monthly.</div>

            <div className="mt-5 space-y-2 text-zinc-200">
              <div>• Everything in Monthly</div>
              <div>• Best value plan</div>
              <div>• Priority access to new features</div>
              <div>• More AI generation tools</div>
            </div>

            <button
  onClick={() => startSubscription("yearly")}
  className="btn-primary w-full"
>
  Subscribe Yearly — $80 (Save $40)
</button>

          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-10">
        <div className="text-xl font-semibold">Everything you unlock</div>
        <div className="mt-5 grid md:grid-cols-2 gap-4 text-zinc-200">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Unlimited characters & chats</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Personas (chat as a persona)</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Private characters</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">NSFW (only if user enables 18+)</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">AI personality helper</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">AI character image generation</div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Need help?</div>
          <div className="text-sm text-zinc-400 mt-1">If you’re new, start Monthly. If you’re committed, Yearly is best value.</div>
        </div>
        <button
          onClick={() => router.push("/contact")}
          className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200"
        >
          Contact us
        </button>
      </section>
    </div>
  );
}
