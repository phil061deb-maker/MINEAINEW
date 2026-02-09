import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId")?.toString() ?? "";

  if (!chatId) return NextResponse.json({ error: "missing_chatId" }, { status: 400 });

  // Ensure chat belongs to this user
  const { data: chat, error: chatErr } = await supabase
    .from("chats")
    .select("id,user_id")
    .eq("id", chatId)
    .single();

  if (chatErr || !chat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
  if (chat.user_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

  const { data: msgs, error: msgErr } = await supabase
    .from("messages")
    .select("role,content,created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (msgErr) return NextResponse.json({ error: "history_failed", details: msgErr.message }, { status: 500 });

  const messages = (msgs ?? []).map((m: any) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
  }));

  return NextResponse.json({ ok: true, messages });
}
