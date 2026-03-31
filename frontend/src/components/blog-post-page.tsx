import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CalendarDays } from "lucide-react";
import type { BlogPost } from "@/lib/blogs";
import { SiteFrame } from "@/components/site-frame";

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

interface BlogPostPageProps {
  blog: BlogPost;
  backHref: string;
}

export function BlogPostPage({ blog, backHref }: BlogPostPageProps) {
  return (
    <SiteFrame>
      <article className="pb-20">
        <div className="mx-auto max-w-5xl px-6 pt-12">
          <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-[#d3b15f]/35 hover:text-white">
            <ArrowLeft size={16} />
            Back to blog
          </Link>
        </div>

        <header className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Help Center Blog</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">{blog.title}</h1>
          <div className="mt-6 flex items-center gap-3 text-sm text-zinc-400">
            <CalendarDays size={16} />
            <span>{formatter.format(new Date(blog.date))}</span>
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{blog.excerpt}</p>
        </header>

        {blog.featured_image ? (
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[2rem] border border-white/10">
              <Image
                src={blog.featured_image}
                alt={blog.title}
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        ) : null}

        <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-p:leading-8 prose-strong:text-white prose-a:text-[#f2d275] prose-li:text-zinc-300 prose-code:text-[#f2d275] prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0c0c0c]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
          </div>
          <aside className="h-fit rounded-[1.75rem] border border-white/10 bg-[#0c0c0c] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Publishing note</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              This blog layout works with local files or CMS content. On Vercel, the public route remains HTTPS and the rendering layer stays in Next.js.
            </p>
          </aside>
        </div>
      </article>
    </SiteFrame>
  );
}
