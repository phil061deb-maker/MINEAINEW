"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChatStartButton({
  characterId,
  className = "btn-primary flex-1 text-center",
  children = "Chat",
}: {
  characterId: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    try {
      setLoading(true);

      const res = await fetch("/api/chat/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error ?? "Failed to start chat");
        return;
      }

      router.push(`/chat/${json.chatId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={go} disabled={loading} className={className}>
      {loading ? "Starting..." : children}
    </button>
  );
}
