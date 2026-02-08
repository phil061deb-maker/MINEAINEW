import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-wrap gap-6 text-sm text-zinc-400">
        <Link href="/terms" className="hover:text-white">Terms</Link>
        <Link href="/privacy" className="hover:text-white">Privacy</Link>
        <Link href="/refund" className="hover:text-white">Refund Policy</Link>
        <Link href="/content-policy" className="hover:text-white">Content Policy</Link>
        <Link href="/contact" className="hover:text-white">Contact</Link>
      </div>
    </footer>
  );
}
