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

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier,trial_ends_at,premium_ends_at")
      .eq("id", auth.user.id)
      .single();

    if (!hasPremiumAccess(profile)) return NextResponse.json({ error: "premium_required" }, { status: 402 });

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "missing_openai_key" }, { status: 500 });

    const body = await req.json().catch(() => null);
    const prompt = (body?.prompt ?? "").toString().trim();
    if (!prompt) return NextResponse.json({ error: "missing_prompt" }, { status: 400 });

    // Generate image
    const img = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const b64 = img.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "no_image" }, { status: 500 });

    // Upload to Supabase Storage
    const bytes = Buffer.from(b64, "base64");
    const filePath = `${auth.user.id}/ai-${Date.now()}.png`;

    const { error: upErr } = await supabase.storage
      .from("character-images")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (upErr) return NextResponse.json({ error: "upload_failed", details: upErr.message }, { status: 500 });

    return NextResponse.json({ path: filePath });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message ?? String(e) }, { status: 500 });
  }
}
