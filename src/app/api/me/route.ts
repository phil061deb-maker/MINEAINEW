import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ loggedIn: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,tier,trial_ends_at,premium_ends_at,is_blocked,is_18_confirmed,nsfw_enabled")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    loggedIn: true,
    email: user.email ?? profile?.email ?? null,
    displayName: profile?.display_name ?? null,
    tier: profile?.tier ?? "free",
    trial_ends_at: profile?.trial_ends_at ?? null,
    premium_ends_at: profile?.premium_ends_at ?? null,
    is_blocked: profile?.is_blocked ?? false,
    is_18_confirmed: profile?.is_18_confirmed ?? false,
    nsfw_enabled: profile?.nsfw_enabled ?? false,
  });
}
