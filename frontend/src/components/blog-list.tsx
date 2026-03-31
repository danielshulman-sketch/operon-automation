import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { BlogPost } from "@/lib/blogs";
import { SiteFrame } from "@/components/site-frame";

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

interface BlogListProps {
  blogs: BlogPost[];
  basePath: string;
  title: string;
  description: string;
}

export function BlogList({ blogs, basePath, title, description }: BlogListProps) {
  return (
    <SiteFrame>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#5b4715_0%,#0b0905_38%,#050505_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Blog</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">{description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {blogs.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-[#0c0c0c] p-10 text-zinc-300">
            No blog posts were found. Add files in <code className="rounded bg-white/5 px-2 py-1">content/blogs</code> or connect a CMS over HTTPS.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <Link
                key={blog.slug}
                href={`${basePath}/${blog.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0c0c] transition hover:border-[#d3b15f]/35"
              >
                {blog.featured_image ? (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={blog.featured_image}
                      alt={blog.title}
                      fill
                      sizes="(min-width: 1280px) 28vw, (min-width: 768px) 44vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-[linear-gradient(135deg,#201807,#090909_55%,#050505)]" />
                )}
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    <CalendarDays size={14} className="text-[#f2d275]" />
                    {formatter.format(new Date(blog.date))}
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-white">{blog.title}</h2>
                  <p className="mt-4 flex-1 text-sm leading-7 text-zinc-300">{blog.excerpt}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d275]">
                    Read article
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteFrame>
  );
}
