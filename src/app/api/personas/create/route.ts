import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim().slice(0, 40);
    const description = (body?.description ?? "").toString().trim().slice(0, 800);

    if (!name) return NextResponse.json({ error: "missing_name" }, { status: 400 });

    const { data, error } = await supabase
      .from("personas")
      .insert({ user_id: user.id, name, description })
      .select("id,name,description,created_at")
      .single();

    if (error || !data) return NextResponse.json({ error: "create_failed", details: error?.message }, { status: 500 });

    return NextResponse.json({ ok: true, persona: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
