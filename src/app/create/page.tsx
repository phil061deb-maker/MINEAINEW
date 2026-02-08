"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Visibility = "public" | "private";

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-sm text-amber-300">✦ {title}</div>
        {sub && <div className="text-sm text-zinc-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function hasPremiumAccess(profile: any) {
  const tier = profile?.tier ?? "free";
  if (tier === "admin" || tier === "premium") return true;

  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const premiumEnds = profile?.premium_ends_at ? new Date(profile.premium_ends_at) : null;

  const now = new Date();
  if (trialEnds && trialEnds > now) return true;
  if (premiumEnds && premiumEnds > now) return true;

  return false;
}

export default function CreatePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [isNsfw, setIsNsfw] = useState(false);

  const [personality, setPersonality] = useState("");
  const [greeting, setGreeting] = useState("");
  const [example, setExample] = useState("");

  // AI helper fields
  const [vibe, setVibe] = useState("romantic");
  const [relationship, setRelationship] = useState("strangers to something");
  const [generating, setGenerating] = useState(false);

  // Image
  const [file, setFile] = useState<File | null>(null);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiImagePath, setAiImagePath] = useState<string | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);

  const [saving, setSaving] = useState(false);

  const [premium, setPremium] = useState(false);
  const [loadingTier, setLoadingTier] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingTier(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setPremium(false);
        setLoadingTier(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tier,trial_ends_at,premium_ends_at")
        .eq("id", auth.user.id)
        .single();

      setPremium(hasPremiumAccess(profile));
      setLoadingTier(false);
    })();
  }, [supabase]);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setAiImagePath(null);
  }

  async function uploadCharacterImage(userId: string, characterName: string, file: File) {
    const safeName = slugify(characterName || "character");
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/${safeName}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("character-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (error) throw new Error(error.message);
    return path;
  }

  function publicImageUrl(path: string | null) {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${base}/storage/v1/object/public/character-images/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  }

  async function generateProfile() {
    if (!name.trim()) return alert("Type a name first.");
    if (!premium) {
      router.push("/upgrade");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/character/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          tags: tags.trim(),
          vibe,
          relationship,
          nsfw: isNsfw,
        }),
      });

      const json = await res.json().catch(() => ({}));
      setGenerating(false);

      if (!res.ok) {
        if (json?.error === "premium_required") {
          router.push("/upgrade");
          return;
        }
        return alert(json?.details ?? json?.error ?? "Generate failed");
      }

      setPersonality(json.personality ?? "");
      setGreeting(json.greeting ?? "");
      setExample(json.example_dialogue ?? "");
      if (!tags.trim() && json.tags) setTags(json.tags);
    } catch (e: any) {
      setGenerating(false);
      alert(e?.message ?? e);
    }
  }

  async function generateImage() {
    if (!premium) return router.push("/upgrade");
    if (!aiImagePrompt.trim()) return alert("Type an image prompt first.");

    setGeneratingImg(true);
    try {
      const res = await fetch("/api/character/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiImagePrompt.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      setGeneratingImg(false);

      if (!res.ok) {
        if (json?.error === "premium_required") return router.push("/upgrade");
        return alert(json?.details ?? json?.error ?? "Image generation failed");
      }

      setAiImagePath(json.path);
      setFile(null);
    } catch (e: any) {
      setGeneratingImg(false);
      alert(e?.message ?? e);
    }
  }

  async function onCreate() {
    if (!name.trim()) return alert("Name is required.");
    if (!personality.trim()) return alert("Personality is required.");

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return alert("Please sign in first.");
    }

    let image_path: string | null = null;

    try {
      if (aiImagePath) {
        image_path = aiImagePath;
      } else if (file) {
        image_path = await uploadCharacterImage(auth.user.id, name.trim(), file);
      }
    } catch (e: any) {
      setSaving(false);
      return alert(`Image upload failed: ${e?.message ?? e}`);
    }

    const tagsArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("characters")
      .insert({
        creator: auth.user.id,
        name: name.trim(),
        description: tagline.trim(),
        personality: personality.trim(),
        greeting: greeting.trim(),
        example_dialogue: example.trim(),
        visibility,
        nsfw: isNsfw,
        image_path,
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) return alert(error.message);

    if (data?.id) {
      localStorage.setItem(`char_tags_${data.id}`, JSON.stringify(tagsArr));
      localStorage.setItem(`char_category_${data.id}`, category.trim());
    }

    alert("Character created!");
    router.push(`/character/${data.id}`);
    router.refresh();
  }

  const previewUrl = publicImageUrl(aiImagePath);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10" aria-label="back">
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-semibold">Create Character</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Upload image + Premium AI tools.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <SectionTitle title="Character image" sub="Upload or generate (Premium/Admin)." />

        <div className="mt-5 grid md:grid-cols-[220px_1fr] gap-5 items-start">
          <div className="h-[220px] w-[220px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden grid place-items-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="AI preview" className="h-full w-full object-cover" />
            ) : file ? (
              <div className="text-center px-4">
                <div className="text-sm text-zinc-400">Selected</div>
                <div className="font-semibold break-words">{file.name}</div>
              </div>
            ) : (
              <div className="text-zinc-400 text-sm">No image yet</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <label className="btn-ghost cursor-pointer">
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
              </label>

              <button className="btn-ghost" onClick={() => { setFile(null); setAiImagePath(null); }}>
                Remove
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">AI image (Premium)</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Write a prompt like: “ultra realistic portrait, cinematic lighting…”
                  </div>
                </div>
                {!loadingTier && !premium && (
                  <Link className="btn-primary px-4 py-2 rounded-2xl" href="/upgrade">
                    Upgrade
                  </Link>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className="input flex-1"
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  placeholder="AI image prompt..."
                  disabled={!premium}
                />
                <button
                  className="btn-primary px-5"
                  onClick={generateImage}
                  disabled={!premium || generatingImg}
                >
                  {generatingImg ? "..." : "Generate"}
                </button>
              </div>

              {premium && (
                <div className="text-xs text-zinc-500 mt-2">
                  Generated images are saved to Supabase Storage automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionTitle title="Basics" sub="Name, tags, and discoverability." />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="label mb-1">Name *</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </div>

          <div>
            <div className="label mb-1">Short description (tagline)</div>
            <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short description" />
          </div>

          <div>
            <div className="label mb-1">Category</div>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="General" />
          </div>

          <div>
            <div className="label mb-1">Tags (comma separated)</div>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fantasy, rivals, slowburn" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold">Visibility</div>
            <div className="text-sm text-zinc-400 mt-1">Private will be Premium/Admin later.</div>

            <div className="mt-3 flex items-center gap-5 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} />
                Public
              </label>

              <label className="flex items-center gap-2">
                <input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} />
                Private
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold">NSFW</div>
            <div className="text-sm text-zinc-400 mt-1">NSFW gating comes later with age check.</div>

            <label className="mt-3 flex items-center gap-3 text-sm text-zinc-200">
              <input type="checkbox" checked={isNsfw} onChange={(e) => setIsNsfw(e.target.checked)} />
              Mark this character as NSFW
            </label>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionTitle title="Premium AI helper" sub="Premium/Admin can generate personality + greeting + example." />

        {!loadingTier && !premium && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            This feature is Premium/Admin only.{" "}
            <Link className="underline ml-2" href="/upgrade">Upgrade</Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="label mb-1">Vibe</div>
            <input className="input" value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="romantic / funny / dark / spicy / wholesome" />
          </div>

          <div>
            <div className="label mb-1">Relationship dynamic</div>
            <input className="input" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="rivals to lovers / best friends / boss & assistant..." />
          </div>
        </div>

        <button
          className="btn-primary w-full py-3 rounded-2xl disabled:opacity-60"
          onClick={generateProfile}
          disabled={generating || loadingTier || !premium}
        >
          {generating ? "Generating..." : "✨ Generate Personality + Greeting + Example"}
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <SectionTitle title="Personality & Behavior" sub="This is what the AI will follow when replying." />

        <div>
          <div className="label mb-1">Personality / Scenario *</div>
          <textarea className="input min-h-[160px]" value={personality} onChange={(e) => setPersonality(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="label mb-1">Greeting message</div>
            <textarea className="input min-h-[110px]" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </div>

          <div>
            <div className="label mb-1">Example dialogue (optional)</div>
            <textarea className="input min-h-[110px]" value={example} onChange={(e) => setExample(e.target.value)} />
          </div>
        </div>
      </div>

      <button
        onClick={onCreate}
        disabled={saving}
        className="btn-primary w-full py-4 rounded-[22px] text-lg font-semibold disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create Character"}
      </button>
    </div>
  );
}
