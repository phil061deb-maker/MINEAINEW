"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Me =
  | { loggedIn: false }
  | {
      loggedIn: true;
      email: string | null;
      displayName: string | null;
      tier: "free" | "premium" | "admin" | string;
      is_18_confirmed?: boolean;
      nsfw_enabled?: boolean;
    };

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
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
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick(wrapRef as unknown as React.RefObject<HTMLElement | null>, () => setOpen(false));

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

function MobileMenu({
  open,
  onClose,
  me,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  me: Me;
  isAdmin: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(panelRef, () => {
    if (open) onClose();
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" />
      <div
        ref={panelRef}
        className="absolute right-3 top-3 w-[calc(100%-24px)] max-w-sm rounded-[28px] border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center">
              <span className="text-amber-300 font-black">✦</span>
            </div>
            <div className="font-semibold tracking-wide">MineAI</div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
          >
            ✕
          </button>
        </div>

        <div className="p-4 grid gap-2">
          <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10" href="/">
            Home
          </Link>
          <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10" href="/create">
            Create
          </Link>
          <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10" href="/characters">
            Public Characters
          </Link>

          {me.loggedIn && (
            <>
              <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10" href="/my-characters">
                My Characters
              </Link>
              <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10" href="/profile">
                Profile
              </Link>
            </>
          )}

          <Link
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10"
            href="/contact"
          >
            Contact
          </Link>

          {isAdmin && (
            <Link
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-200 hover:bg-amber-500/20"
              href="/admin"
            >
              Admin
            </Link>
          )}

          <div className="h-px bg-white/10 my-2" />

          <Link
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 text-center font-semibold"
            href="/upgrade"
          >
            Upgrade
          </Link>

          {!me.loggedIn ? (
            <div className="grid grid-cols-2 gap-2">
              <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-center" href="/auth/signin">
                Sign in
              </Link>
              <Link onClick={onClose} className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-center" href="/auth/signup">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 px-1">
              Signed in as <span className="text-zinc-200">{me.email ?? "Account"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [me, setMe] = useState<Me>({ loggedIn: false });
  const [mobileOpen, setMobileOpen] = useState(false);

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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 ml-4">
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/">Home</Link>
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/create">Create</Link>
          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/characters">Public Characters</Link>

          {me.loggedIn && (
            <>
              <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/my-characters">My Characters</Link>
              <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/profile">Profile</Link>
            </>
          )}

          <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/contact">Contact</Link>

          {isAdmin && (
            <Link className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" href="/admin">Admin</Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
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

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden px-3 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} me={me} isAdmin={isAdmin} />
    </header>
  );
}
