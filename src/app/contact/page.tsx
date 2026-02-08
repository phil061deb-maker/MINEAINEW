"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function autofillEmail() {
    const { data } = await supabase.auth.getUser();
    const e = data.user?.email;
    if (e) setEmail(e);
  }

  async function submit() {
    setDone(null);
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setDone("Please fill in email, subject, and message.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      setSending(false);

      if (!res.ok) {
        setDone(json?.details ?? json?.error ?? "Failed to send.");
        return;
      }

      setEmail("");
      setSubject("");
      setMessage("");
      setDone("✅ Message sent! We’ll get back to you soon.");
    } catch (e: any) {
      setSending(false);
      setDone(e?.message ?? "Network error");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/" className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10">
          ←
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Contact Us</h1>
          <p className="text-sm text-zinc-400 mt-1">Send a message to the MineAI team.</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <div className="label mb-1">Email</div>
          <div className="flex gap-2">
            <input className="input flex-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            <button className="btn-ghost" onClick={autofillEmail}>Use my login</button>
          </div>
        </div>

        <div>
          <div className="label mb-1">Subject</div>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" />
        </div>

        <div>
          <div className="label mb-1">Message</div>
          <textarea className="input min-h-[160px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." />
        </div>

        <button className="btn-primary w-full py-3 rounded-2xl disabled:opacity-60" onClick={submit} disabled={sending}>
          {sending ? "Sending..." : "Send message"}
        </button>

        {done && (
          <div className="text-sm text-zinc-200 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            {done}
          </div>
        )}
      </div>
    </div>
  );
}
