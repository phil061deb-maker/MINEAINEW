import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const display_name = (body?.display_name ?? "").toString().slice(0, 60);
    const bio = (body?.bio ?? "").toString().slice(0, 500);

    const over18 = Boolean(body?.over18);

    // Load profile to check premium
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id,tier,trial_ends_at,premium_ends_at,over18,allow_nsfw")
      .eq("id", user.id)
      .single();

    if (pErr || !profile) return NextResponse.json({ error: "profile_missing" }, { status: 500 });

    const premiumAccess = hasPremiumAccess(profile);

    // ✅ allow_nsfw only if Premium/Admin AND over18 true
    let allow_nsfw = Boolean(body?.allow_nsfw);
    if (!premiumAccess) allow_nsfw = false;
    if (!over18) allow_nsfw = false;

    const { error: uErr } = await supabase
      .from("profiles")
      .update({ display_name, bio, over18, allow_nsfw })
      .eq("id", user.id);

    if (uErr) return NextResponse.json({ error: "update_failed", details: uErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, premiumAccess, display_name, bio, over18, allow_nsfw });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
