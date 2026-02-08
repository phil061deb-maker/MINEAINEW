import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UserRow = {
  id: string;
  email: string | null;
  tier: string;
  is_blocked: boolean;
  trial_ends_at: string | null;
  premium_ends_at: string | null;
  created_at: string | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  // Must be admin
  const { data: me } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
  if (me?.tier !== "admin") return NextResponse.json({ error: "not_admin" }, { status: 403 });

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id,email,tier,is_blocked,trial_ends_at,premium_ends_at,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, users: (data ?? []) as UserRow[] });
}
