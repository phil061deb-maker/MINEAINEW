import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { paypalFetch } from "@/lib/paypal";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const subscriptionId = body?.subscriptionId?.toString?.();
  if (!subscriptionId) return NextResponse.json({ error: "missing_subscriptionId" }, { status: 400 });

  await paypalFetch(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "User requested cancel" }),
  });

  return NextResponse.json({ ok: true });
}
