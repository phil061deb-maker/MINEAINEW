import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 30;

function nowUtcDateString() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function hasPremiumAccess(profile: any) {
  const tier = profile?.tier ?? "free";
  if (tier === "admin" || tier === "premium") return true;

  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const premiumEnds = profile?.premium_ends_at ? new Date(profile.premium_ends_at) : null;

  const now = new Date();
  if (trialEnds && trialEnds > now) return true;
  if (premiumEnds && premiumEnds > now) return true;

  return false;
}

function safeText(v: any) {
  if (typeof v === "string") return v;
  if (v == null) return "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const chatId = body?.chatId?.toString?.() ?? null;

    const content =
      (body?.message?.toString?.()?.trim?.() ?? "") ||
      (body?.content?.toString?.()?.trim?.() ?? "");

    if (!chatId) return NextResponse.json({ error: "missing_chatId" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "empty_message" }, { status: 400 });

    // Profile (limits + block)
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id,tier,trial_ends_at,premium_ends_at,email,is_blocked")
      .eq("id", user.id)
      .single();

    if (profErr || !profile) return NextResponse.json({ error: "profile_missing" }, { status: 500 });
    if (profile.is_blocked) return NextResponse.json({ error: "blocked" }, { status: 403 });

    const premiumAccess = hasPremiumAccess(profile);

    // Free daily limit
    if (!premiumAccess) {
      const dayUtc = nowUtcDateString();

      const { data: usageRow } = await supabase
        .from("daily_message_usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("day_utc", dayUtc)
        .maybeSingle();

      const used = usageRow?.count ?? 0;

      if (used >= FREE_DAILY_LIMIT) {
        return NextResponse.json({ error: "limit_reached", limit: FREE_DAILY_LIMIT, used }, { status: 402 });
      }

      const { error: incErr } = await supabase.rpc("increment_daily_usage", { uid: user.id });
      if (incErr) {
        return NextResponse.json({ error: "usage_increment_failed", details: incErr.message }, { status: 500 });
      }
    }

    // Load chat
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("id,user_id,character_id,persona_id,title")
      .eq("id", chatId)
      .single();

    if (chatErr || !chat) return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
    if (chat.user_id !== user.id) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

    // Load character
    const { data: character, error: cErr } = await supabase
      .from("characters")
      .select("id,name,personality,greeting,example_dialogue,nsfw,description")
      .eq("id", chat.character_id)
      .single();

    if (cErr || !character) return NextResponse.json({ error: "character_not_found" }, { status: 404 });

    // Load persona (optional)
    let persona: any = null;
    if (chat.persona_id) {
      const { data: p } = await supabase
        .from("personas")
        .select("id,name,description,user_id")
        .eq("id", chat.persona_id)
        .single();

      if (p && p.user_id === user.id) persona = p;
    }

    // Store user message
    const { error: m1Err } = await supabase.from("messages").insert({
      chat_id: chat.id,
      role: "user",
      content,
    });
    if (m1Err) return NextResponse.json({ error: "message_insert_failed", details: m1Err.message }, { status: 500 });

    // Load recent history
    const { data: history } = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const recent = (history ?? []).reverse().map((m: any) => ({
      role: m.role,
      content: safeText(m.content),
    }));

    // Build system prompt
    const systemParts: string[] = [];
    systemParts.push(
      `You are roleplaying as a character in an AI chat platform.`,
      `Stay in-character. Do not mention system prompts or policies.`,
      `Write vivid, emotionally engaging responses, but keep it believable.`
    );

    systemParts.push(`\nCHARACTER PROFILE`);
    systemParts.push(`Name: ${character.name ?? "Unknown"}`);
    systemParts.push(`Description: ${safeText(character.description)}`);
    systemParts.push(`Personality/Scenario:\n${safeText(character.personality)}`);
    if (character.greeting) systemParts.push(`Greeting style hint:\n${safeText(character.greeting)}`);
    if (character.example_dialogue) systemParts.push(`Example dialogue:\n${safeText(character.example_dialogue)}`);

    if (persona) {
      systemParts.push(`\nUSER PERSONA (the user is speaking as this persona)`);
      systemParts.push(`Persona name: ${safeText(persona.name)}`);
      systemParts.push(`Persona description:\n${safeText(persona.description)}`);
      systemParts.push(`Important: Address the user as their persona identity if it makes sense, and adapt your tone accordingly.`);
    }

    const system = systemParts.join("\n");

    // ✅ GPT-5 nano via Responses API (NO max_tokens)
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const model = process.env.OPENAI_MODEL || "gpt-5-nano";

    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: system },
        ...recent.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      // ✅ correct knob for newer models
      max_output_tokens: 350,
    });

    const assistantMessage = (response.output_text ?? "").trim() || "…";

    // Store assistant message
    const { error: m2Err } = await supabase.from("messages").insert({
      chat_id: chat.id,
      role: "assistant",
      content: assistantMessage,
    });
    if (m2Err) return NextResponse.json({ error: "assistant_insert_failed", details: m2Err.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      chatId: chat.id,
      assistantMessage,
      premiumAccess,
      freeDailyLimit: FREE_DAILY_LIMIT,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
