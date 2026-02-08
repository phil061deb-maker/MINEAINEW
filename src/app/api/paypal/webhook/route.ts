import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Minimal webhook handler for launch.
// Next step after launch: signature verification using PayPal verify-webhook-signature endpoint.

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json().catch(() => null);

  const eventType = body?.event_type?.toString?.() ?? "";
  if (!eventType) return NextResponse.json({ ok: true });

  // We flip premium when subscription becomes active
  if (eventType !== "BILLING.SUBSCRIPTION.ACTIVATED") {
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  const resource = body?.resource;
  const customId = resource?.custom_id?.toString?.() ?? "";
  const subId = resource?.id?.toString?.() ?? "";

  // custom_id format: "monthly:<uid>" or "yearly:<uid>"
  if (!customId.includes(":")) return NextResponse.json({ ok: true, note: "missing custom_id" });

  const [plan, uid] = customId.split(":");
  if (!uid) return NextResponse.json({ ok: true, note: "bad custom_id" });

  const now = new Date();
  const premiumEnds = plan === "yearly" ? addDays(now, 365) : addDays(now, 30);

  // store subscription id + premium tier
  const { error } = await supabase
    .from("profiles")
    .update({
      tier: "premium",
      premium_ends_at: premiumEnds.toISOString(),
      paypal_subscription_id: subId || null,
    })
    .eq("id", uid);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, upgraded: uid, plan, premiumEndsAt: premiumEnds.toISOString() });
}
