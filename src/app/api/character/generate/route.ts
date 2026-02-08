import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function hasPremiumAccess(profile: any) {
  const tier = profile?.tier ?? "free";
  if (tier === "admin" || tier === "premium") return true;

  const now = new Date();
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const premiumEnds = profile?.premium_ends_at ? new Date(profile.premium_ends_at) : null;

  if (trialEnds && trialEnds > now) return true;
  if (premiumEnds && premiumEnds > now) return true;

  return false;
}

function toText(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join("\n");
  if (typeof v === "object") {
    // common shapes from models: {text:"..."}, {content:"..."}, {lines:[...]}
    if (typeof v.text === "string") return v.text;
    if (typeof v.content === "string") return v.content;
    if (Array.isArray(v.lines)) return v.lines.map(toText).filter(Boolean).join("\n");
    if (Array.isArray(v.items)) return v.items.map(toText).filter(Boolean).join("\n");
    // fallback: pretty JSON
    return JSON.stringify(v, null, 2);
  }
  return String(v);
}

function toTags(v: any): string {
  const t = toText(v).trim();
  return t
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(", ");
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id,tier,trial_ends_at,premium_ends_at")
      .eq("id", auth.user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json(
        { error: "profile_missing", details: profErr?.message ?? "No profile row" },
        { status: 500 }
      );
    }

    if (!hasPremiumAccess(profile)) {
      return NextResponse.json({ error: "premium_required" }, { status: 402 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "missing_openai_key" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);

    const name = (body?.name ?? "").toString().trim();
    const category = (body?.category ?? "General").toString().trim();
    const tags = (body?.tags ?? "").toString().trim();
    const vibe = (body?.vibe ?? "romantic").toString().trim();
    const relationship = (body?.relationship ?? "strangers to something").toString().trim();
    const nsfw = Boolean(body?.nsfw);

    if (!name) return NextResponse.json({ error: "missing_name" }, { status: 400 });

    const system = `
You write character profiles for an AI roleplay chat site.

Return ONLY valid JSON with keys:
personality, greeting, example_dialogue, tags

Each of personality/greeting/example_dialogue MUST be a string.
tags MUST be a single comma-separated string.

Rules:
- Immersive, emotionally engaging.
- Avoid underage, non-consensual, incest content.
- If nsfw is false: PG-13.
- If nsfw is true: adult but consensual (no explicit porn instructions).
- Personality includes: background, tone, speaking style, boundaries, goals.
- Greeting hooks the user immediately.
- Example dialogue: 6-10 lines alternating USER/CHAR.
`.trim();

    const userMsg = `
Name: ${name}
Category: ${category}
User tags: ${tags || "(none)"}
Vibe: ${vibe}
Relationship dynamic: ${relationship}
NSFW allowed: ${nsfw ? "Yes (adult only)" : "No"}
`.trim();

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const raw = JSON.parse(content);

    const personality = toText(raw.personality).trim();
    const greeting = toText(raw.greeting).trim();
    const example_dialogue = toText(raw.example_dialogue).trim();
    const tagsOut = toTags(raw.tags);

    return NextResponse.json({ personality, greeting, example_dialogue, tags: tagsOut });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message ?? String(e) }, { status: 500 });
  }
}
