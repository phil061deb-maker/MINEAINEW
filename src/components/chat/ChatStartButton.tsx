"use client";

import { useRouter } from "next/navigation";

export default function ChatStartButton({
  characterId,
  className,
}: {
  characterId: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      className={className ?? "btn-primary"}
      onClick={async () => {
        const res = await fetch("/api/chat/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId }),
        });

        const json = await res.json();
        if (!res.ok) {
          alert(json?.error ?? "failed_to_start_chat");
          return;
        }

        router.push(`/chat/${json.chatId}`);
        router.refresh();
      }}
    >
      Chat
    </button>
  );
}
