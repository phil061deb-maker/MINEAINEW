import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Accept either:
    // - { chatId, keepPersona }
    // OR
    // - { characterId, personaId }
    const currentChatId = body?.chatId?.toString?.() ?? "";
    const characterIdDirect = body?.characterId?.toString?.() ?? "";
    const keepPersona = body?.keepPersona === false ? false : true;

    let characterId: string | null = characterIdDirect || null;
    let personaId: string | null = body?.personaId?.toString?.() ?? null;

    if (currentChatId && !characterId) {
      // Derive character from current chat
      const { data: curChat, error: curErr } = await supabase
        .from("chats")
        .select("id,user_id,character_id,persona_id")
        .eq("id", currentChatId)
        .single();

      if (curErr || !curChat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
      if (curChat.user_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

      characterId = curChat.character_id;
      if (keepPersona) personaId = curChat.persona_id;
    }

    if (!characterId) return NextResponse.json({ error: "missing_characterId" }, { status: 400 });

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
