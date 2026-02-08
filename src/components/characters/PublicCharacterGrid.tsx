"use client";

import Link from "next/link";
import { getImageSrc } from "@/lib/images";

type CharacterRow = {
  id: string;
  name: string;
  description: string | null;
  visibility: string | null;
  nsfw: boolean | null;
  created_at: string;
  image_path: string | null;
};

function ymd(dateStr: string) {
  // created_at comes as ISO string from Supabase.
  // We display stable YYYY-MM-DD to avoid hydration mismatch.
  try {
    return String(dateStr).slice(0, 10);
  } catch {
    return "";
  }
}

export default function PublicCharacterGrid({ data }: { data: CharacterRow[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {(data ?? []).map((c) => {
        const img = getImageSrc(c.image_path);

        return (
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-zinc-400">
                {c.visibility}
                {c.nsfw ? " • NSFW" : ""}
              </div>
              <div className="text-xs text-zinc-500">{ymd(c.created_at)}</div>
            </div>

            <div className="mt-3 h-[180px] w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative grid place-items-center">
              {img ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={c.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const parent = el.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div style="color:#a1a1aa;font-size:13px;padding:10px;text-align:center">Image failed to load</div>';
                      }
                    }}
                  />
                  <div className="absolute bottom-2 left-2 right-2 text-[11px] text-zinc-400 truncate bg-black/50 px-2 py-1 rounded-lg">
                    {img}
                  </div>
                </>
              ) : (
                <div className="text-zinc-400 text-sm">No image</div>
              )}
            </div>

            <h2 className="text-lg font-semibold mt-4">{c.name}</h2>
            <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
              {c.description || "—"}
            </p>

            <div className="mt-5 flex gap-2">
              <Link className="btn-ghost flex-1 text-center" href={`/character/${c.id}`}>
                View
              </Link>
              <Link className="btn-primary flex-1 text-center" href={`/chat/${c.id}`}>
                Chat
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
