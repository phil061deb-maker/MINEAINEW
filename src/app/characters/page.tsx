import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatStartButton from "@/components/chat/ChatStartButton";

function publicImageUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/character-images/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
}

export default async function PublicCharactersPage() {
  const supabase = await createSupabaseServerClient();

  // IMPORTANT: We MUST fetch the real character "id" from the characters table
  const { data: characters, error } = await supabase
    .from("characters")
    .select("id,name,description,image_path,visibility,nsfw,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="card p-8 text-zinc-300">
        Failed to load characters: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Public Characters</h1>
          <p className="text-sm text-zinc-400">Loaded from Supabase (latest first).</p>
        </div>

        <Link className="btn-primary" href="/create">
          + Create
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(characters ?? []).map((c) => {
          const img = publicImageUrl(c.image_path ?? null);

          return (
            <div key={c.id} className="card p-5 space-y-4">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>{c.visibility}</span>
                <span>{c.nsfw ? "NSFW" : ""}</span>
              </div>

              <div className="h-[180px] w-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 grid place-items-center">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={c.name ?? "Character"} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-zinc-500 text-sm">No image</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="text-sm text-zinc-400 line-clamp-2">
                  {c.description || "—"}
                </div>
              </div>

              <div className="flex gap-2">
                {/* ✅ VIEW MUST use character.id */}
                <Link className="btn-ghost flex-1 text-center" href={`/characters/${c.id}`}>
                  View
                </Link>

                {/* ✅ CHAT MUST use character.id */}
                <ChatStartButton className="btn-primary flex-1" characterId={c.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
