export function getCharacterImage(path) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return `${base}/storage/v1/object/public/character-images/${path}`;
}
