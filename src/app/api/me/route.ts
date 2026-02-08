import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier,email,display_name")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    loggedIn: true,
    email: profile?.email ?? user.email,
    displayName: profile?.display_name ?? null,
    tier: profile?.tier ?? "free",
  });
}
