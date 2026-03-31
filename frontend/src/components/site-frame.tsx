import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenText, LifeBuoy, Newspaper } from "lucide-react";

const navigation = [
  { href: "/help", label: "Help Center", icon: LifeBuoy },
  { href: "/help/blog", label: "Blog", icon: Newspaper },
  { href: "/help/article/launch-a-vercel-help-center", label: "Getting Started", icon: BookOpenText },
];

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/help" className="flex items-center gap-3 text-sm font-semibold tracking-[0.24em] text-white uppercase">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d3b15f]/40 bg-[#1a1406] text-[#f2d275]">
              EA
            </span>
            Easy AI Help
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-[#d3b15f]/40 hover:text-white"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>Built with Next.js on Vercel. Blog content can come from local files or HTTPS-based CMS fetches.</p>
          <div className="flex items-center gap-5">
            <Link href="/help" className="transition hover:text-white">
              Help Center
            </Link>
            <Link href="/help/blog" className="transition hover:text-white">
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
