import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-app text-zinc-100">
          <div className="sticky top-0 z-50">
            <div className="w-full bg-amber-500/10 border-b border-amber-500/20">
              <div className="mx-auto max-w-6xl px-4 py-2 text-sm text-amber-200">
                ❤️ 20% of profits will go to the <span className="font-semibold">CHOC Children’s Cancer Foundation</span>.
              </div>
            </div>
            <SiteHeader />
          </div>

          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

          <footer className="border-t border-white/10 mt-16">
            <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-400 flex flex-wrap gap-4">
              <a className="hover:text-zinc-200" href="/legal/terms">Terms of Service</a>
              <a className="hover:text-zinc-200" href="/legal/privacy">Privacy Policy</a>
              <a className="hover:text-zinc-200" href="/legal/refund">Refund Policy</a>
              <a className="hover:text-zinc-200" href="/legal/content">Content Policy</a>
              <span className="ml-auto">© {new Date().getFullYear()} MineAI</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
