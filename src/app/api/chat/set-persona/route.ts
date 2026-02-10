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
    const personaId = body?.personaId ? body.personaId.toString() : null;

    if (!chatId) return NextResponse.json({ error: "missing_chatId" }, { status: 400 });

    // chat must be owned
    const { data: chat, error: cErr } = await supabase
      .from("chats")
      .select("id,user_id")
      .eq("id", chatId)
      .single();

    if (cErr || !chat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
    if (chat.user_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

    // persona must belong to user (or null allowed)
    if (personaId) {
      const { data: p } = await supabase
        .from("personas")
        .select("id,user_id")
        .eq("id", personaId)
        .single();

      if (!p || p.user_id !== user.id) {
        return NextResponse.json({ error: "persona_not_allowed" }, { status: 403 });
      }
    }

    const { error: uErr } = await supabase
      .from("chats")
      .update({ persona_id: personaId })
      .eq("id", chatId);

    if (uErr) return NextResponse.json({ error: "update_failed", details: uErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
