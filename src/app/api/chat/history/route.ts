import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId") ?? "";

  if (!chatId) return NextResponse.json({ error: "missing_chatId" }, { status: 400 });

  const { data: chat, error: chatErr } = await supabase
    .from("chats")
    .select("id,user_id")
    .eq("id", chatId)
    .single();

  if (chatErr || !chat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
  if (chat.user_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("role,content,created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (msgErr) return NextResponse.json({ error: "messages_failed", details: msgErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    messages: (messages ?? []).map((m: any) => ({
      role: m.role,
      content: m.content ?? "",
    })),
  });
}
