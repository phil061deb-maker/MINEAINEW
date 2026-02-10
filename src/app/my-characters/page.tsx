import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatStartButton from "@/components/chat/ChatStartButton";

function publicImageUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/character-images/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
}

export default async function MyCharactersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <div className="card p-8 text-zinc-300">
        Please sign in.
        <div className="mt-4">
          <Link className="btn-primary" href="/auth/signin">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // ✅ IMPORTANT:
  // We try common owner columns. One of these will work in your DB.
  // (Only the first one that returns rows will be used.)
  const tries = [
    { col: "user_id", label: "user_id" },
    { col: "creator_id", label: "creator_id" },
    { col: "owner_id", label: "owner_id" },
  ] as const;

  let characters: any[] | null = null;

  for (const t of tries) {
    const { data, error } = await supabase
      .from("characters")
      .select("id,name,description,image_path,created_at")
      // @ts-ignore
      .eq(t.col, auth.user.id)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      characters = data;
      break;
    }
  }

  // ✅ If still empty, show ALL characters created by you via RLS (no filter)
  // If your RLS is correct, this will only return your rows.
  if (!characters) {
    const { data } = await supabase
      .from("characters")
      .select("id,name,description,image_path,created_at")
      .order("created_at", { ascending: false });

    characters = data ?? [];
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">My Characters</h1>
          <div className="text-sm text-zinc-400">Characters you created.</div>
        </div>

        <Link className="btn-primary" href="/create">
          + Create
        </Link>
      </div>

      {(!characters || characters.length === 0) ? (
        <div className="card p-8 text-zinc-300">
          No characters found for this account.
          <div className="text-sm text-zinc-400 mt-2">
            This usually means your character rows aren’t linked to your user yet.
          </div>
          <div className="mt-4">
            <Link className="btn-primary" href="/create">
              Create your first character
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {characters.map((c) => {
            const img = publicImageUrl(c.image_path ?? null);

            return (
              <div key={c.id} className="card p-5">
                <div className="h-[190px] rounded-3xl overflow-hidden border border-white/10 bg-white/5 grid place-items-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-zinc-400 text-sm">No image</div>
                  )}
                </div>

                <div className="mt-4 font-semibold">{c.name}</div>
                <div className="text-sm text-zinc-400 mt-1 line-clamp-2">{c.description || "—"}</div>

                <div className="mt-4 flex gap-2">
                  <Link className="btn-ghost" href={`/characters/${c.id}`}>
                    View
                  </Link>

                  <ChatStartButton characterId={c.id} className="btn-primary">
                    Chat
                  </ChatStartButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
