"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  function sendReset() {
    alert("Phase 2: Supabase password reset email.");
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full max-w-md">
        <div className="card p-7">
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Enter your email and we’ll send a reset link.
          </p>

          <div className="mt-6">
            <div className="label mb-1">Email</div>
            <input
              className="input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button className="btn-primary w-full py-3 rounded-2xl mt-5" onClick={sendReset}>
            Send reset link
          </button>

          <div className="mt-6 text-sm text-zinc-400">
            Back to{" "}
            <Link className="text-amber-300 hover:text-amber-200" href="/auth/signin">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
