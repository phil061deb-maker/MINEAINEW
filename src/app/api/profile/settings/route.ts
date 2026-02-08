import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const is_18_confirmed = !!body?.is_18_confirmed;
  const nsfw_enabled = !!body?.nsfw_enabled;

  // If they turn off 18+, NSFW must also be off
  const finalNsfw = is_18_confirmed ? nsfw_enabled : false;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_18_confirmed,
      nsfw_enabled: finalNsfw,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, is_18_confirmed, nsfw_enabled: finalNsfw });
}
