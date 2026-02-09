import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function publicImageUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // IMPORTANT: this assumes your bucket name is EXACTLY: character-images
  // and your DB column is EXACTLY: image_path
  return `${base}/storage/v1/object/public/character-images/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: c, error } = await supabase
    .from("characters")
    .select("id,name,description,personality,greeting,example_dialogue,nsfw,visibility,image_path,created_at")
    .eq("id", id)
    .single();

  if (error || !c) {
    return (
      <div className="card p-8 text-zinc-300">
        Character not found.
        <div className="mt-4">
          <Link className="btn-primary" href="/characters">
            Back to Public Characters
          </Link>
        </div>
      </div>
    );
  }

  const img = publicImageUrl(c.image_path ?? null);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start gap-6 flex-col md:flex-row">
          <div className="h-[260px] w-full md:w-[320px] rounded-3xl overflow-hidden border border-white/10 bg-white/5 grid place-items-center">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <div className="text-zinc-400 text-sm">No image</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-zinc-400">
              {c.visibility}
              {c.nsfw ? " • NSFW" : ""}
            </div>

            <h1 className="text-3xl font-semibold mt-2">{c.name}</h1>

            <p className="text-zinc-300 mt-3 whitespace-pre-wrap">
              {c.description || "—"}
            </p>

            <div className="mt-6 flex gap-2 flex-wrap">
              <Link className="btn-ghost" href="/characters">
                Back
              </Link>

              <Link className="btn-primary" href={`/chat/${c.id}`}>
                Chat
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-6 space-y-2">
          <div className="text-sm font-semibold">Personality / Scenario</div>
          <div className="text-sm text-zinc-300 whitespace-pre-wrap">
            {c.personality || "—"}
          </div>
        </div>

        <div className="card p-6 space-y-2">
          <div className="text-sm font-semibold">Greeting</div>
          <div className="text-sm text-zinc-300 whitespace-pre-wrap">
            {c.greeting || "—"}
          </div>
        </div>

        <div className="card p-6 space-y-2 md:col-span-2">
          <div className="text-sm font-semibold">Example Dialogue</div>
          <div className="text-sm text-zinc-300 whitespace-pre-wrap">
            {c.example_dialogue || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
