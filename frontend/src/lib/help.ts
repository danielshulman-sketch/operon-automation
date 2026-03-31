export interface HelpCategory {
  slug: string;
  title: string;
  description: string;
}

export interface HelpArticle {
  slug: string;
  title: string;
  summary: string;
  category: string;
  lastUpdated: string;
  readTime: string;
  body: string;
}

const categories: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Launch the help site, publish posts, and keep your content deploy-friendly.",
  },
  {
    slug: "content-workflows",
    title: "Content Workflows",
    description: "Structure articles and blog posts so editors can ship changes without friction.",
  },
  {
    slug: "integrations",
    title: "Integrations",
    description: "Connect forms, automations, and external systems with HTTPS-based APIs.",
  },
  {
    slug: "deployment",
    title: "Deployment",
    description: "Use Vercel builds, previews, and production deploys to publish your help center.",
  },
];

const articles: HelpArticle[] = [
  {
    slug: "launch-a-vercel-help-center",
    title: "Launch a Help Center on Vercel",
    summary: "The minimum structure for a searchable help site with a blog section.",
    category: "getting-started",
    lastUpdated: "2026-03-30",
    readTime: "4 min read",
    body: `
# Launch a Help Center on Vercel

Use a standard Next.js app with route groups for your knowledge base and blog.

## Recommended structure

- \`app/help/page.tsx\` for the help landing page
- \`app/help/article/[slug]/page.tsx\` for support articles
- \`app/help/blog/page.tsx\` for the blog index
- \`app/help/blog/[slug]/page.tsx\` for blog posts

## Content options

You have two clean options:

1. Keep posts in the repo as \`.md\`, \`.mdx\`, or JSON files.
2. Fetch them from a CMS using \`fetch()\`.

## Important

You do **not** need Node's \`http\` module to render blog posts on Vercel. Use local files or HTTPS requests with \`fetch()\` instead.
`,
  },
  {
    slug: "publish-blog-posts-without-http-module",
    title: "Publish Blog Posts Without the HTTP Module",
    summary: "What to use instead of Node's low-level HTTP server APIs in a Vercel app.",
    category: "content-workflows",
    lastUpdated: "2026-03-30",
    readTime: "3 min read",
    body: `
# Publish Blog Posts Without the HTTP Module

Vercel hosts your Next.js application behind HTTPS. That means you normally work at the framework level.

## Use these tools instead

- Static files for local post content
- \`fetch()\` for CMS or API content
- Route handlers only when you need a custom server action

## When route handlers help

If you want an admin dashboard to create blog posts, a route handler can validate the request and write content to a database, CMS, or GitHub-backed content folder.

## Public URLs

Your blog posts should resolve to URLs like:

\`https://yourdomain.com/help/blog/post-slug\`
`,
  },
  {
    slug: "connect-a-cms-over-https",
    title: "Connect a CMS Over HTTPS",
    summary: "Use secure CMS fetches and let Vercel deploy the resulting pages.",
    category: "integrations",
    lastUpdated: "2026-03-28",
    readTime: "5 min read",
    body: `
# Connect a CMS Over HTTPS

Most headless CMS platforms expose HTTPS endpoints or SDKs. In Next.js, use \`fetch()\` in server components or route handlers.

## Keep the contract small

- Request only the fields you need
- Normalize content into a shared post shape
- Render the same post component whether data comes from files or a CMS

## Cache strategy

For a help center, static generation or revalidation is usually enough. Reserve fully dynamic rendering for content that changes constantly.
`,
  },
  {
    slug: "deploy-content-updates-on-vercel",
    title: "Deploy Content Updates on Vercel",
    summary: "How local content, preview deploys, and production publishing fit together.",
    category: "deployment",
    lastUpdated: "2026-03-26",
    readTime: "4 min read",
    body: `
# Deploy Content Updates on Vercel

If your posts live in the repository, every commit becomes a preview or production deploy.

## Common workflow

1. Add or update a post file.
2. Push the change to GitHub.
3. Let Vercel build the updated site.
4. Review the preview URL before merging.

## Why this works well for help sites

Help content is mostly read-heavy and changes in discrete releases, so build-time content is predictable and cheap to host.
`,
  },
];

export function getHelpCategories() {
  return categories.map((category) => ({
    ...category,
    articleCount: articles.filter((article) => article.category === category.slug).length,
  }));
}

export function getAllHelpArticles() {
  return articles.slice();
}

export function getFeaturedHelpArticles(limit = 3) {
  return articles.slice(0, limit);
}

export function getHelpArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug) ?? null;
}
