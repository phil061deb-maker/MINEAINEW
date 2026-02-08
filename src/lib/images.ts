export function getImageSrc(image_path: string | null | undefined) {
  if (!image_path) return null;

  // If DB already stores a full URL, use it.
  if (image_path.startsWith("http://") || image_path.startsWith("https://")) {
    return image_path;
  }

  // Otherwise treat it as a storage path and build the public URL.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.NEXT_PUBLIC_CHARACTER_IMAGES_BUCKET || "character-images";
  if (!base) return null;

  const clean = image_path.startsWith("/") ? image_path.slice(1) : image_path;
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}
