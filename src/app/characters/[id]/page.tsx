import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatStartButton from "@/components/chat/ChatStartButton";

function publicImageUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return `${base}/storage/v1/object/public/character-images/${path}`;
}

export default async function PublicCharactersPage() {
  const supabase = await createSupabaseServerClient();

  const { data: characters, error } = await supabase
    .from("characters")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="card p-8 text-red-300">
        Failed to load characters: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Public Characters</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(characters ?? []).map((c) => {
          const img = publicImageUrl(c.image_path);

          return (
            <div key={c.id} className="card p-5 space-y-4">

              {/* IMAGE */}
              <div className="h-[200px] rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid place-items-center h-full text-zinc-500">
                    No image
                  </div>
                )}
              </div>

              {/* NAME */}
              <div className="text-lg font-semibold">
                {c.name}
              </div>

              {/* DESC */}
              <div className="text-sm text-zinc-400 line-clamp-2">
                {c.description || "—"}
              </div>

              {/* BUTTONS */}
              <div className="flex gap-2">

                {/* ✅ THIS FIXES CHARACTER DETAIL */}
                <Link
                  href={`/characters/${c.id}`}
                  className="btn-ghost flex-1 text-center"
                >
                  View
                </Link>

                {/* ✅ THIS FIXES CHAT */}
                <ChatStartButton
                  characterId={c.id}
                  className="btn-primary flex-1"
                />

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
