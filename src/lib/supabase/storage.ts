export function getCharacterImage(path: string | null | undefined) {
  if (!path) return null;

  // If DB already stores a full URL, use it directly.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.NEXT_PUBLIC_CHARACTER_IMAGES_BUCKET || "character-images";
  if (!base) return null;

  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}
