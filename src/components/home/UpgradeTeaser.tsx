import Link from "next/link";

export default function UpgradeTeaser() {
  return (
    <section className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 backdrop-blur-xl p-8 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-sm text-amber-300">✦ Premium</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
            Upgrade to unlock everything
          </h2>
          <p className="mt-2 text-sm text-zinc-300 max-w-2xl">
            Unlimited chat, private + NSFW (18+) characters, premium AI tools to build characters,
            AI images, and unlimited personas.
          </p>
        </div>

        <Link className="btn-primary px-6 py-3 rounded-2xl" href="/upgrade">
          Upgrade
        </Link>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          "Unlimited messages",
          "AI personality generator (Premium)",
          "AI character images (Premium)",
          "Private characters",
          "NSFW characters (18+)",
          "Unlimited personas",
        ].map((x) => (
          <div key={x} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
            {x}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        Admins automatically have Premium perks. Admin can also grant 3-day or 7-day Premium trials.
      </div>
    </section>
  );
}
