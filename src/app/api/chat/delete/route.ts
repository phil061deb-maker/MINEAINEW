import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const chatId = body?.chatId?.toString?.() ?? "";
    if (!chatId) return NextResponse.json({ error: "missing_chatId" }, { status: 400 });

    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("id,user_id")
      .eq("id", chatId)
      .single();

    if (chatErr || !chat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
    if (chat.user_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

    const { error: delMsgsErr } = await supabase.from("messages").delete().eq("chat_id", chatId);
    if (delMsgsErr) return NextResponse.json({ error: "delete_messages_failed", details: delMsgsErr.message }, { status: 500 });

    const { error: delChatErr } = await supabase.from("chats").delete().eq("id", chatId);
    if (delChatErr) return NextResponse.json({ error: "delete_chat_failed", details: delChatErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
