"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCharacterImage } from "@/lib/supabase/storage";

export default function ChatPage() {
  const params = useParams<{ chatId: string }>();
  const chatId = params?.chatId;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState<{ name: string; image: string | null; characterId: string | null } | null>(null);

  const [historyError, setHistoryError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function loadChat() {
    setLoading(true);
    setHistoryError(null);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      router.push("/auth/signin");
      return;
    }

    // Fetch chat
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("id, user_id, character_id, persona_id, title")
      .eq("id", chatId)
      .single();

    if (chatErr || !chat) {
      setHistoryError("chat_not_found");
      setHeader(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    if (chat.user_id !== auth.user.id) {
      setHistoryError("not_allowed");
      setHeader(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data: character } = await supabase
      .from("characters")
      .select("id,name,image_path")
      .eq("id", chat.character_id)
      .single();

    setHeader({
      name: character?.name ?? chat.title ?? "Chat",
      image: getCharacterImage(character?.image_path ?? null),
      characterId: character?.id ?? chat.character_id ?? null,
    });

    // Load history
    try {
      const res = await fetch(`/api/chat/history?chatId=${encodeURIComponent(chatId)}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        setHistoryError(json?.error ?? "history_failed");
        setMessages([]);
      } else {
        setMessages(Array.isArray(json?.messages) ? json.messages : []);
      }
    } catch {
      setHistoryError("history_failed");
      setMessages([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!chatId) return;
    loadChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    setSending(true);
    setInput("");

    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content: text }), // IMPORTANT: send `content`
      });

      const json = await res.json();

      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${json?.error ?? "send_failed"}` }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: json?.assistantMessage ?? json?.reply ?? "…" }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error sending message." }]);
    }

    setSending(false);
  }

  if (loading) {
    return (
      <div className="card p-10">
        <div className="text-zinc-300">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 overflow-hidden grid place-items-center">
            {header?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={header.image} alt={header.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-zinc-400 text-sm">🙂</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-xs text-zinc-400">Chatting with</div>
            <div className="font-semibold truncate">{header?.name ?? "Chat"}</div>
            {historyError && <div className="text-xs text-amber-300 mt-1">History error: {historyError}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 text-xs">
            ● Live
          </span>

          <button
            className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
            onClick={async () => {
              // Create a new chat for SAME character, keep old chats
              const res = await fetch("/api/chat/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chatId, // we pass current chatId, API will derive character_id
                  keepPersona: true,
                }),
              });

              const json = await res.json();
              if (!res.ok) return alert(json?.error ?? "failed");

              router.push(`/chat/${json.chatId}`);
              router.refresh();
            }}
          >
            New Chat
          </button>

          <button
            className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-5 min-h-[420px]">
        <div className="space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[70%] rounded-2xl bg-amber-500/20 border border-amber-500/25 px-4 py-3 text-zinc-100"
                    : "max-w-[70%] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-zinc-200"
                }
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}

          {!messages.length && <div className="text-zinc-400 text-sm">Say hi 👋</div>}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-4 flex items-center gap-3">
        <input
          className="w-full bg-transparent outline-none text-zinc-100 placeholder:text-zinc-500 px-3 py-2 rounded-2xl border border-white/10 bg-white/5"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={sending}
        />

        <button
          className="px-6 py-3 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-60"
          onClick={send}
          disabled={sending}
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
