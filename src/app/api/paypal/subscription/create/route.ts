import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { paypalFetch } from "@/lib/paypal";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = (body?.plan ?? "monthly").toString();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return NextResponse.json({ error: "missing_site_url" }, { status: 500 });

  const planId =
    plan === "yearly" ? process.env.PAYPAL_PLAN_ID_YEARLY : process.env.PAYPAL_PLAN_ID_MONTHLY;

  if (!planId) return NextResponse.json({ error: "missing_plan_id" }, { status: 500 });

  // Create subscription
  const sub = await paypalFetch("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      custom_id: `${plan}:${user.id}`, // tie to our user
      application_context: {
        brand_name: "MineAI",
        locale: "en-US",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${siteUrl}/upgrade?success=1`,
        cancel_url: `${siteUrl}/upgrade?canceled=1`,
      },
    }),
  });

  const approve = (sub?.links ?? []).find((l: any) => l?.rel === "approve")?.href;
  if (!approve) return NextResponse.json({ error: "no_approve_link", sub }, { status: 500 });

  return NextResponse.json({ ok: true, id: sub.id, approveUrl: approve });
}
