import { BlogList } from "@/components/blog-list";
import { getAllBlogs } from "@/lib/blogs";

export const metadata = {
  title: "Blog",
  description: "Help-center blog posts for a Vercel-hosted Next.js site.",
};

export default async function HelpBlogPage() {
  const blogs = await getAllBlogs();

  return (
    <BlogList
      blogs={blogs}
      basePath="/help/blog"
      title="Blog posts attached to the help center."
      description="Use this section for deeper product notes, rollout explainers, and workflow articles that do not fit short support docs."
    />
  );
}
