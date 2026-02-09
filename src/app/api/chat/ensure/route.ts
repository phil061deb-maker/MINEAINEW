import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const characterId = body?.characterId?.toString?.() ?? "";

  if (!characterId) {
    return NextResponse.json({ error: "missing_characterId" }, { status: 400 });
  }

  // Load character
  const { data: character, error: charErr } = await supabase
    .from("characters")
    .select("id,name,image_path,description,personality,greeting,example_dialogue,nsfw,visibility")
    .eq("id", characterId)
    .single();

  if (charErr || !character) {
    return NextResponse.json({ error: "character_not_found" }, { status: 404 });
  }

  // Find existing chat
  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("character_id", characterId)
    .order("created_at", { ascending: false })
    .limit(1);

  let chatId = existing?.[0]?.id ?? null;

  // Create if missing
  if (!chatId) {
    const { data: created, error: createErr } = await supabase
      .from("chats")
      .insert({ user_id: auth.user.id, character_id: characterId })
      .select("id")
      .single();

    if (createErr || !created) {
      return NextResponse.json({ error: "chat_create_failed", details: createErr?.message }, { status: 500 });
    }

    chatId = created.id;
  }

  return NextResponse.json({ ok: true, chatId, character });
}
