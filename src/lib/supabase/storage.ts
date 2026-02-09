export function getCharacterImage(path: string | null) {
  if (!path) return null;

  // If the DB already stores a full URL, just use it.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  // Bucket = character-images (public)
  const safe = encodeURIComponent(path).replace(/%2F/g, "/");
  return `${base}/storage/v1/object/public/character-images/${safe}`;
}
