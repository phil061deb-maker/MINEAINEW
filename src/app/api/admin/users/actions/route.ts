import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  // verify admin
  const { data: me } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
  if (me?.tier !== "admin") return NextResponse.json({ error: "not_admin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;
  const targetUserId = body?.userId as string | undefined;

  if (!action || !targetUserId) {
    return NextResponse.json({ error: "missing_action_or_userId" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Block/Unblock
  if (action === "set_blocked") {
    const blocked = !!body?.blocked;
    const { error } = await admin
      .from("profiles")
      .update({ is_blocked: blocked })
      .eq("id", targetUserId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Set tier
  if (action === "set_tier") {
    const tier = (body?.tier as string | undefined) ?? "free";
    const { error } = await admin.from("profiles").update({ tier }).eq("id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Grant 3 or 7 day trial
  if (action === "grant_trial") {
    const days = Number(body?.days);
    if (![3, 7].includes(days)) {
      return NextResponse.json({ error: "days_must_be_3_or_7" }, { status: 400 });
    }

    const trial_ends_at = addDays(days);

    const { error } = await admin
      .from("profiles")
      .update({ trial_ends_at })
      .eq("id", targetUserId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, trial_ends_at });
  }

  // Revoke access (back to free)
  if (action === "revoke_access") {
    const { error } = await admin
      .from("profiles")
      .update({ tier: "free", trial_ends_at: null, premium_ends_at: null })
      .eq("id", targetUserId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
