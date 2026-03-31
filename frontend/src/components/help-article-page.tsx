import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import type { HelpArticle } from "@/lib/help";
import { SiteFrame } from "@/components/site-frame";

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function HelpArticlePage({ article }: { article: HelpArticle }) {
  return (
    <SiteFrame>
      <article className="pb-20">
        <div className="mx-auto max-w-5xl px-6 pt-12">
          <Link href="/help" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-[#d3b15f]/35 hover:text-white">
            <ArrowLeft size={16} />
            Back to help center
          </Link>
        </div>

        <header className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">{article.readTime}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">{article.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{article.summary}</p>
          <p className="mt-6 text-sm text-zinc-400">Updated {formatter.format(new Date(article.lastUpdated))}</p>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-p:leading-8 prose-strong:text-white prose-a:text-[#f2d275] prose-li:text-zinc-300 prose-code:text-[#f2d275] prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0c0c0c]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
          </div>
          <aside className="h-fit rounded-[1.75rem] border border-white/10 bg-[#0c0c0c] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Category</p>
            <p className="mt-4 text-lg font-semibold text-white">{article.category.replace("-", " ")}</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Use this article as a starter template and expand the help center with repo-based content or CMS-backed pages.
            </p>
          </aside>
        </div>
      </article>
    </SiteFrame>
  );
}
