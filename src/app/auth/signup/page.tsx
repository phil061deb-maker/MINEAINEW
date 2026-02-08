"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUpEmail() {
    if (password !== confirm) return alert("Passwords do not match.");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) return alert(error.message);

    alert("Check your email to confirm your account!");
  }

  async function signUpGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full max-w-md">
        <div className="card p-7">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center">
              <span className="text-amber-300 font-black">✦</span>
            </div>
            <div>
              <div className="text-sm text-amber-300">MineAI</div>
              <h1 className="text-2xl font-semibold leading-tight">Sign up</h1>
            </div>
          </div>

          <p className="text-sm text-zinc-400 mt-4">
            Create your account. Then we’ll verify your email.
          </p>

          <button
            onClick={signUpGoogle}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm text-zinc-200 flex items-center justify-center gap-2"
          >
            <span className="text-lg">G</span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-zinc-500">or</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="label mb-1">Email</div>
              <input
                className="input"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="label mb-1">Password</div>
              <input
                className="input"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <div className="label mb-1">Confirm password</div>
              <input
                className="input"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              onClick={signUpEmail}
              disabled={loading}
              className="btn-primary w-full py-3 rounded-2xl text-base font-semibold disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </div>

          <div className="mt-6 text-sm text-zinc-400">
            Already have an account?{" "}
            <Link className="text-amber-300 hover:text-amber-200" href="/auth/signin">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">
          By continuing you agree to our{" "}
          <Link className="hover:text-zinc-200" href="/legal/terms">Terms</Link>,{" "}
          <Link className="hover:text-zinc-200" href="/legal/privacy">Privacy</Link>,{" "}
          <Link className="hover:text-zinc-200" href="/legal/content">Content Policy</Link>.
        </div>
      </div>
    </div>
  );
}
