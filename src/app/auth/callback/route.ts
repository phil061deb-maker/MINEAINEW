// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getPublicOrigin(request: Request, fallbackUrl: URL) {
  // Render/Proxies set these headers to the real public URL
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (proto && host) return `${proto}://${host}`;

  // fallback (works locally)
  return fallbackUrl.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const origin = getPublicOrigin(request, url);

  // ✅ Always redirect to the real public domain (not localhost:10000)
  return NextResponse.redirect(new URL("/", origin));
}
