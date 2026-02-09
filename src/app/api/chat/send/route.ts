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

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      return NextResponse.json({ error: "not_logged_in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const chatId = body?.chatId?.toString?.();
    const content = body?.message?.toString?.()?.trim?.();

    if (!chatId) {
      return NextResponse.json({ error: "missing_chatId" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "empty_message" }, { status: 400 });
    }

    // ✅ Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier,trial_ends_at,premium_ends_at,is_blocked")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "profile_missing" }, { status: 500 });
    }

    if (profile.is_blocked) {
      return NextResponse.json({ error: "blocked" }, { status: 403 });
    }

    const premiumAccess = hasPremiumAccess(profile);

    // ✅ FREE LIMIT
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
        return NextResponse.json(
          { error: "limit_reached", limit: FREE_DAILY_LIMIT },
          { status: 402 }
        );
      }

      await supabase.rpc("increment_daily_usage", { uid: user.id });
    }

    // ✅ LOAD CHAT
    const { data: chat } = await supabase
      .from("chats")
      .select("id,user_id,character_id")
      .eq("id", chatId)
      .single();

    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
    }

    // ✅ LOAD CHARACTER
    const { data: character } = await supabase
      .from("characters")
      .select("name,personality,description")
      .eq("id", chat.character_id)
      .single();

    // ✅ SAVE USER MESSAGE
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content,
    });

    // ✅ LOAD HISTORY
    const { data: history } = await supabase
      .from("messages")
      .select("role,content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(20);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ⭐ BEST MODEL FOR CHAT APPS
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.1,
      messages: [
        {
          role: "system",
          content: `
You are roleplaying as this character:

Name: ${character?.name ?? "Unknown"}
Description: ${character?.description ?? ""}
Personality: ${character?.personality ?? ""}

Stay in character at all times.
Be emotionally engaging.
Never mention AI.
          `,
        },
        ...(history ?? []).map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ??
      "Something went wrong.";

    // ✅ SAVE AI MESSAGE
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({
      ok: true,
      assistantMessage: reply,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "server_error" },
      { status: 500 }
    );
  }
}
