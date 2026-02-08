import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildPublicUrl(bucket: string, path: string | null) {
  if (!path) return null;

  // If the DB accidentally contains a full URL, just return it.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("characters")
    .select("id,name,image_path,visibility,created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const bucket = process.env.NEXT_PUBLIC_CHARACTER_IMAGES_BUCKET || "character-images";

  return NextResponse.json({
    ok: !error,
    error: error?.message ?? null,
    bucket,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    row: data ?? null,
    computedImageUrl: buildPublicUrl(bucket, data?.image_path ?? null),
  });
}
