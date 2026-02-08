"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Me =
  | { loggedIn: false }
  | { loggedIn: true; email: string | null; displayName: string | null; tier: "free" | "premium" | "admin" | string };

function useOutsideClick(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

function UserDropdown({
  label,
  isAdmin,
  onLogout,
}: {
  label: string;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useOutsideClick(wrapRef, () => setOpen(false));

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-zinc-200"
      >
        <span className="max-w-[180px] truncate">{label}</span>
        <span className="text-zinc-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-lg overflow-hidden">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Profile
          </Link>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Settings
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-amber-200 hover:bg-white/10"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="h-px bg-white/10" />

          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [me, setMe] = useState<Me>({ loggedIn: false });
  const isAdmin = me.loggedIn && me.tier === "admin";

  async function refreshMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const json = (await res.json()) as Me;
    setMe(json);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await refreshMe();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      await refreshMe();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return alert(error.message);

    await refreshMe();
    router.push("/");
    router.refresh();
  }

  const userLabel =
    me.loggedIn ? (me.displayName?.trim() ? me.displayName : me.email ?? "Account") : "Account";

  return (
    <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center">
            <span className="text-amber-300 font-black">✦</span>
          </div>
          <span className="font-semibold tracking-wide">MineAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 ml-4">
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/">Home</Link>
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/create">Create</Link>
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/characters">Public Characters</Link>
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/contact">Contact</Link>

          {me.loggedIn && (
            <>
              <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/my-characters">My Characters</Link>
              <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/profile">Profile</Link>
            </>
          )}

          {isAdmin && (
            <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/admin">Admin</Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link className="px-4 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400" href="/upgrade">
            Upgrade
          </Link>

          {!me.loggedIn ? (
            <>
              <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/auth/signin">
                Sign in
              </Link>
              <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/auth/signup">
                Sign up
              </Link>
            </>
          ) : (
            <UserDropdown label={userLabel} isAdmin={isAdmin} onLogout={logout} />
          )}
        </div>
      </div>
    </header>
  );
}
