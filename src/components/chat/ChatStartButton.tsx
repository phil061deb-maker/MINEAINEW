"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChatStartButton({
  characterId,
  className,
}: {
  characterId: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? "failed_to_start_chat");
        setLoading(false);
        return;
      }

      router.push(`/chat/${json.chatId}`);
      router.refresh();
    } catch {
      alert("network_error");
    }
    setLoading(false);
  }

  return (
    <button onClick={start} disabled={loading} className={className ?? "btn-primary"}>
      {loading ? "Starting..." : "Chat"}
    </button>
  );
}
