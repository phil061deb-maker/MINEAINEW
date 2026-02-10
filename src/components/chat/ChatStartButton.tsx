"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChatStartButton({
  characterId,
  personaId = null,
  className = "",
  children = "Chat",
}: {
  characterId: string;
  personaId?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startChat() {
    try {
      setLoading(true);

      const res = await fetch("/api/chat/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, personaId }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error ?? "chat_start_failed");
        return;
      }

      const chatId = json?.chatId;
      if (!chatId) {
        alert("chat_start_failed: no chatId");
        return;
      }

      // ✅ IMPORTANT: must be /chat/<chatId> (NOT /chat?<chatId>)
      router.push(`/chat/${chatId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={startChat} disabled={loading} className={className}>
      {loading ? "..." : children}
    </button>
  );
}
