import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

type AdminTab = "Overview" | "Users" | "Characters" | "Moderation" | "Billing";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function TabButton({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-5 py-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/15 text-amber-200"
          : "px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
      }
    >
      {label}
    </Link>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: AdminTab }>;
}) {
  const tab = (await searchParams).tab ?? "Overview";

  const user = await getUser();
  if (!user) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-zinc-400 mt-2">You must sign in to continue.</p>
        <div className="mt-6 flex gap-2">
          <Link className="btn-ghost" href="/auth/signin">Sign in</Link>
          <Link className="btn-primary" href="/auth/signup">Sign up</Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tier,email")
    .eq("id", user.id)
    .single();

  const tier = profile?.tier ?? "free";
  const isAdmin = tier === "admin";

  if (error || !isAdmin) {
    return (
      <div className="card p-6">
        <div className="text-sm text-amber-300">✦ Access denied</div>
        <h1 className="text-2xl font-semibold mt-1">Admin only</h1>
        <p className="text-zinc-400 mt-3">
          You don’t have permission to view this page.
        </p>
        <div className="mt-6 flex gap-2">
          <Link className="btn-primary" href="/">Go Home</Link>
          <Link className="btn-ghost" href="/profile">Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-sm text-amber-300">✦ Admin Dashboard</div>
            <h1 className="text-3xl font-semibold mt-1">Admin</h1>
            <p className="text-sm text-zinc-400 mt-2">
              Secure server-side admin gate is now active.
            </p>
          </div>
          <div className="text-sm text-zinc-300">
            Signed in as <span className="font-semibold">{profile?.email ?? user.email}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton href="/admin?tab=Overview" active={tab === "Overview"} label="Overview" />
          <TabButton href="/admin?tab=Users" active={tab === "Users"} label="Users" />
          <TabButton href="/admin?tab=Characters" active={tab === "Characters"} label="Characters" />
          <TabButton href="/admin?tab=Moderation" active={tab === "Moderation"} label="Moderation" />
          <TabButton href="/admin?tab=Billing" active={tab === "Billing"} label="Billing" />

          <div className="ml-auto flex gap-2">
            <Link className="btn-ghost" href="/characters">Public Characters</Link>
            <Link className="btn-primary" href="/create">+ Create Character</Link>
          </div>
        </div>
      </div>

      {tab === "Overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="text-sm text-zinc-400 mt-2">
              Next we will connect real counts + add trial tools (3-day / 7-day).
            </p>

            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <Stat label="Total users" value="—" />
              <Stat label="Total characters" value="—" />
              <Stat label="Messages (24h)" value="—" />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold">Admin powers (coming in Phase 2)</div>
              <ul className="mt-3 text-sm text-zinc-300 space-y-2 list-disc pl-5">
                <li>Grant Premium trials: 3-day / 7-day</li>
                <li>Revoke trial/premium</li>
                <li>Moderation queue + hide/remove characters</li>
                <li>Daily usage + analytics</li>
              </ul>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Quick actions (next)</h3>
            <div className="mt-4 space-y-3">
              <button className="btn-primary w-full" disabled>
                Grant 3-day trial (next)
              </button>
              <button className="btn-ghost w-full" disabled>
                Grant 7-day trial (next)
              </button>
              <button className="btn-ghost w-full" disabled>
                Open moderation queue (next)
              </button>
            </div>
          </div>
        </div>
      )}

      {tab !== "Overview" && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold">{tab}</h2>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
            UI will be wired to real data next.
          </div>
        </div>
      )}
    </div>
  );
}
