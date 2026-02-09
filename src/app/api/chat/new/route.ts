import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const characterId = body?.characterId?.toString?.() ?? "";

    if (!characterId) return NextResponse.json({ error: "missing_characterId" }, { status: 400 });

    const personaId = body?.personaId?.toString?.() ?? null;

    const { data: newChat, error: newErr } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        character_id: characterId,
        persona_id: personaId,
        title: null,
      })
      .select("id")
      .single();

    if (newErr || !newChat) {
      return NextResponse.json({ error: "chat_create_failed", details: newErr?.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, chatId: newChat.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
