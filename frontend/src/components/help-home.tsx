import Link from "next/link";
import { ArrowRight, BookMarked, CloudUpload, Globe, Layers3, Sparkles } from "lucide-react";
import { getAllBlogs } from "@/lib/blogs";
import { getAllHelpArticles, getFeaturedHelpArticles, getHelpCategories } from "@/lib/help";
import { SiteFrame } from "@/components/site-frame";

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export async function HelpHome() {
  const [blogs, categories, articles, allArticles] = await Promise.all([
    getAllBlogs(),
    Promise.resolve(getHelpCategories()),
    Promise.resolve(getFeaturedHelpArticles(3)),
    Promise.resolve(getAllHelpArticles()),
  ]);

  const latestPosts = blogs.slice(0, 3);

  return (
    <SiteFrame>
      <section className="overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,#5b4715_0%,#0b0905_34%,#050505_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:py-28">
          <div className="space-y-8">
            <span className="inline-flex min-h-11 items-center rounded-full border border-[#d3b15f]/35 bg-[#d3b15f]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#f2d275]">
              Support, Docs, and Blog
            </span>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                A Vercel help site does not need the Node <span className="text-[#f2d275]">http</span> module.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-300">
                Use Next.js routes for your help center, local content or a CMS for posts, and HTTPS-based fetches for integrations.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/help/blog"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f2d275] px-6 py-3 font-semibold text-black transition hover:translate-y-[-1px]"
              >
                Browse Blog
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/help/article/launch-a-vercel-help-center"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-[#d3b15f]/45"
              >
                Read Setup Guide
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              {
                icon: CloudUpload,
                title: "Deploy-first workflow",
                text: "Commit content updates and let Vercel previews validate the help site before production.",
              },
              {
                icon: Globe,
                title: "HTTPS everywhere",
                text: "Blog content should be published to public URLs like https://yourdomain.com/help/blog/post-slug.",
              },
              {
                icon: Layers3,
                title: "One content model",
                text: "Render the same blog page whether the content comes from files in the repo or a headless CMS.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2d275]/15 text-[#f2d275]">
                  <Icon size={20} />
                </div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[#0c0c0c] p-8">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">
            <Sparkles size={16} />
            Publishing flow
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-white">What to use instead of low-level HTTP</h2>
          <div className="mt-6 space-y-4 text-zinc-300">
            <p>
              For a Vercel-hosted help site, use local Markdown, MDX, or JSON files if you want a simple repo-based workflow.
            </p>
            <p>
              If content lives outside the app, use Next.js server-side <code className="rounded bg-white/5 px-2 py-1">fetch()</code> over HTTPS.
            </p>
            <p>
              Only add route handlers when you need custom backend behavior such as authenticated publishing or webhook processing.
            </p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-[#d3b15f]/20 bg-[#120f08] p-8">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">
            <BookMarked size={16} />
            Recommended URL shape
          </div>
          <div className="mt-6 space-y-5">
            {[
              "https://yourdomain.com/help",
              "https://yourdomain.com/help/article/launch-a-vercel-help-center",
              "https://yourdomain.com/help/blog/vercel-help-site-content-workflow",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 font-mono text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Help categories</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Organize the support content</h2>
          </div>
          <Link href="/help/article/launch-a-vercel-help-center" className="text-sm font-semibold text-zinc-300 transition hover:text-white">
            View starter article
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/help/article/${allArticles.find((article) => article.category === category.slug)?.slug ?? "launch-a-vercel-help-center"}`}
              className="group rounded-[1.75rem] border border-white/10 bg-[#0c0c0c] p-6 transition hover:border-[#d3b15f]/35"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">
                {String(category.articleCount).padStart(2, "0")} articles
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">{category.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{category.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-200 group-hover:text-white">
                Open docs
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Popular docs</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start with the core setup articles</h2>
          </div>
          <div className="grid gap-5">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/help/article/${article.slug}`}
                className="rounded-[1.75rem] border border-white/10 bg-[#0c0c0c] p-6 transition hover:border-[#d3b15f]/35"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  <span>{article.readTime}</span>
                  <span>{formatter.format(new Date(article.lastUpdated))}</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{article.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">{article.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f2d275]">Recent blog posts</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Long-form updates and explainers</h2>
          </div>
          <Link href="/help/blog" className="text-sm font-semibold text-zinc-300 transition hover:text-white">
            Open all posts
          </Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {latestPosts.length > 0 ? (
            latestPosts.map((blog) => (
              <Link
                key={blog.slug}
                href={`/help/blog/${blog.slug}`}
                className="rounded-[1.75rem] border border-white/10 bg-[#0c0c0c] p-6 transition hover:border-[#d3b15f]/35"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  {formatter.format(new Date(blog.date))}
                </p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{blog.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{blog.excerpt}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-[#0c0c0c] p-8 text-zinc-300 lg:col-span-3">
              No blog posts are available yet. Add a post file under <code className="rounded bg-white/5 px-2 py-1">content/blogs</code> or wire a CMS feed with HTTPS.
            </div>
          )}
        </div>
      </section>
    </SiteFrame>
  );
}
