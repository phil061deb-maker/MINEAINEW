import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const { data, error } = await supabase
      .from("personas")
      .select("id,name,description,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "list_failed", details: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, personas: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
