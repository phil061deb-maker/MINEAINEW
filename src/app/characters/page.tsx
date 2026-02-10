import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatStartButton from "@/components/chat/ChatStartButton";

function publicImageUrl(path: string | null) {
  if (!path) return null;

  // If you already stored a full URL in the DB, use it directly
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/character-images/${encodeURIComponent(clean).replace(/%2F/g, "/")}`;
}

export default async function PublicCharactersPage() {
  const supabase = await createSupabaseServerClient();

  const { data: characters, error } = await supabase
    .from("characters")
    .select("id,name,description,image_path,visibility,nsfw,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    return (
      <div className="card p-8 text-red-200">
        Error loading characters: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Public Characters</h1>
          <p className="text-sm text-zinc-400 mt-1">Loaded from Supabase.</p>
        </div>

        <Link className="btn-primary" href="/create">
          + Create
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(characters ?? []).map((c) => {
          const img = publicImageUrl(c.image_path);

          return (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  {c.visibility}
                  {c.nsfw ? " • NSFW" : ""}
                </div>
              </div>

              <div className="mt-3 h-[180px] w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden grid place-items-center">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-zinc-400 text-sm">No image</div>
                )}
              </div>

              <h2 className="text-lg font-semibold mt-4">{c.name}</h2>
              <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                {c.description || "—"}
              </p>

              <div className="mt-5 flex gap-2">
                {/* ✅ THIS MUST GO TO DETAIL PAGE */}
                <Link className="btn-ghost flex-1 text-center" href={`/characters/${c.id}`}>
                  View
                </Link>

                {/* ✅ THIS STARTS CHAT PROPERLY */}
                <ChatStartButton className="btn-primary flex-1" characterId={c.id} />
              </div>
            </div>
          );
        })}
      </div>

      {(characters ?? []).length === 0 && (
        <div className="card p-8 text-center text-zinc-400">
          No public characters found.
        </div>
      )}
    </div>
  );
}
