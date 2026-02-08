import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").toString().trim();
  const subject = (body?.subject ?? "").toString().trim();
  const message = (body?.message ?? "").toString().trim();

  if (!email || !subject || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const { error } = await supabase.from("contact_messages").insert({
    user_id: userId,
    email,
    subject,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "insert_failed", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
