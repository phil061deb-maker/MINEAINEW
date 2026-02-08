import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");
    if (!chatId) {
      return NextResponse.json({ error: "missing_chatId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    // Verify chat belongs to user
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("id,user_id")
      .eq("id", chatId)
      .single();

    if (chatErr || !chat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
    if (chat.user_id !== auth.user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

    // Load messages (assumes table is 'messages' with chat_id, role, content, created_at)
    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

    return NextResponse.json({
      messages: (msgs ?? []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
